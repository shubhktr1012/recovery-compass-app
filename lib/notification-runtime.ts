import { PROGRAM_METADATA } from '@/content/programs/metadata';
import {
  ProgramDayRow,
  ProgramProgressionRow,
  ProgramRow,
  ProgramTemplateRow,
  getFallbackDay,
  getProgramContentMode,
  mapProgramDayRowToDayContent,
  resolveTemplateDayRow,
} from '@/hooks/contentQueryUtils';
import {
  buildProgramNotificationPlan,
  type DayCompletionNotificationState,
  type NotificationPlanType,
  type NotificationPlannerDay,
  type NotificationTemplateOverrides,
} from '@/lib/notification-scheduler';
import { NotificationService, type ScheduleProgramNotificationsResult } from '@/lib/notifications';
import {
  createEmptyFreeDetoxProgress,
  FREE_DETOX_PROGRAM_SLUG,
  FREE_DETOX_TOTAL_DAYS,
  getNextFreeDetoxDay,
  loadFreeDetoxProgress,
  type FreeProgramProgressRecord,
} from '@/lib/free-program-progress';
import { isSameLocalCalendarDay } from '@/lib/notification-app-open';
import type { DayStateCardDetail } from '@/lib/day-states';
import { getLatestConsecutiveSkippedDayCount } from '@/lib/programs/absence';
import { getEffectiveScheduleDate } from '@/lib/programs/schedule';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';
import { supabase } from '@/lib/supabase';
import type { DayContent, ProgramSlug } from '@/types/content';
import type { DayState } from '@/types/resolver';
import { resolveDay } from '@/lib/card-resolver';

type NotificationRuntimeProfile = {
  free_tier_activated_at?: string | null;
  notifications_enabled?: boolean | null;
  push_opt_in?: boolean | null;
};

type NotificationRuntimeAccess = Pick<
  ProgramAccessSnapshot,
  | 'ownedProgram'
  | 'purchaseState'
  | 'completionState'
  | 'programState'
  | 'currentDay'
  | 'scheduledStartDate'
  | 'pausedAt'
  | 'completedAt'
>;

type NotificationRuntimeDayState = {
  dayNumber: number;
  dayState: DayState;
  cardsCompleted: number;
  cardsTotal: number;
  cardDetails: DayStateCardDetail[];
};

type NotificationTemplateRow = {
  body_template: string | null;
  notification_type: string;
  program_slug: string;
  title_template: string | null;
  trigger_hour: number | null;
  trigger_minute: number | null;
};

type NotificationTemplateVariantRow = {
  body_template: string | null;
  notification_type: string;
  program_slug: string;
  title_template: string | null;
  variant_key: string;
  weight: number | null;
};

type NotificationRuntimeService = Pick<
  typeof NotificationService,
  'scheduleProgramNotificationPlans'
>;

interface RescheduleProgramNotificationsArgs {
  access: NotificationRuntimeAccess;
  userId: string | null | undefined;
  profile?: NotificationRuntimeProfile | null;
  now?: Date;
  openedToday?: boolean;
  shouldAbort?: () => boolean;
  loadDayContent?: (programSlug: ProgramSlug, dayNumber: number) => Promise<DayContent | null>;
  loadDayStates?: (userId: string, programSlug: ProgramSlug) => Promise<NotificationRuntimeDayState[]>;
  loadFreeDetoxProgress?: (userId: string) => Promise<FreeProgramProgressRecord | null>;
  loadHasPaidProgramAccess?: (userId: string) => Promise<boolean>;
  notificationService?: NotificationRuntimeService;
}

const EMPTY_RESULT: ScheduleProgramNotificationsResult = {
  cancelledIds: [],
  scheduledIds: [],
};
const ROLLING_NOTIFICATION_DAYS = 7;

function buildNotificationScheduleOptions(
  now: Date,
  access?: NotificationRuntimeAccess,
  shouldAbort?: () => boolean
) {
  return {
    now,
    programState: access?.programState ?? null,
    shouldAbort,
  };
}

export async function rescheduleProgramNotificationsForAccess(
  args: RescheduleProgramNotificationsArgs
): Promise<ScheduleProgramNotificationsResult> {
  const notificationService = args.notificationService ?? NotificationService;
  const now = args.now ?? new Date();
  const notificationsEnabled = Boolean(
    args.profile?.notifications_enabled || args.profile?.push_opt_in
  );

  if (!notificationsEnabled || !args.userId) {
    return notificationService.scheduleProgramNotificationPlans(
      [],
      buildNotificationScheduleOptions(now, args.access, args.shouldAbort)
    );
  }

  if (isSchedulableAccess(args.access)) {
    return scheduleAccessNotifications({
      ...args,
      access: args.access,
      notificationsEnabled,
      now,
      notificationService,
      userId: args.userId,
    });
  }

  return scheduleFreeDetoxNotifications({
    ...args,
    notificationsEnabled,
    now,
    notificationService,
    userId: args.userId,
  });
}

async function scheduleAccessNotifications(args: RescheduleProgramNotificationsArgs & {
  access: NotificationRuntimeAccess;
  notificationsEnabled: boolean;
  now: Date;
  notificationService: NotificationRuntimeService;
  userId: string;
}): Promise<ScheduleProgramNotificationsResult> {
  const programSlug = args.access.ownedProgram;
  const dayNumber = args.access.currentDay;

  if (!programSlug || !dayNumber) {
    return args.notificationService.scheduleProgramNotificationPlans(
      [],
      buildNotificationScheduleOptions(args.now, args.access, args.shouldAbort)
    );
  }

  try {
    const dayStates = await (args.loadDayStates ?? loadNotificationDayStates)(args.userId, programSlug);
    const consecutiveAbsentDays = getLatestConsecutiveSkippedDayCount(dayStates);
    const plans = [];
    let hadContentLoadFailure = false;

    for (const scheduleDay of getRollingScheduleDays(args.access, args.now)) {
      try {
        const dayContent = await (args.loadDayContent ?? loadNotificationDayContent)(
          programSlug,
          scheduleDay.dayNumber
        );
        if (!dayContent) {
          continue;
        }

        const day = resolveDay({
          contentMode: 'unique',
          dayContent,
          dayNumber: scheduleDay.dayNumber,
          programSlug,
        });
        const notificationTemplates = await loadNotificationTemplates({
          dayNumber: scheduleDay.dayNumber,
          programSlug,
          userId: args.userId,
        });

        const isCurrentProgramDay = scheduleDay.dayNumber === dayNumber;
        const dayStateRow = dayStates.find((row) => row.dayNumber === scheduleDay.dayNumber);
        const dayCompletion =
          isCurrentProgramDay && dayStateRow && dayStateRow.dayState !== 'skipped'
            ? buildDayCompletionFromState(day, dayStateRow)
            : null;
        const completedCardIndexes =
          isCurrentProgramDay && dayStateRow ? getCompletedCardIndexes(dayStateRow) : undefined;

        plans.push(
          ...buildProgramNotificationPlan({
            access: {
              ...args.access,
              currentDay: scheduleDay.dayNumber,
            },
            completedCardIndexes,
            consecutiveAbsentDays: isCurrentProgramDay ? consecutiveAbsentDays : null,
            day,
            dayCompletion,
            notificationsEnabled: args.notificationsEnabled,
            notificationTemplates,
            now: args.now,
            openedToday: resolveOpenedTodayForScheduleDay({
              openedToday: args.openedToday,
              isCurrentProgramDay,
            }),
            programName: PROGRAM_METADATA[programSlug].name,
            repeatTierOneDaily:
              isCurrentProgramDay &&
              isSameLocalCalendarDay(scheduleDay.scheduleDate, args.now) &&
              (args.access.programState === 'active' || args.access.programState === 'scheduled'),
            scheduleDate: scheduleDay.scheduleDate,
          })
        );
      } catch (dayError) {
        hadContentLoadFailure = true;
        console.warn('Skipping notification plan for day with unavailable content', {
          dayNumber: scheduleDay.dayNumber,
          error: dayError,
          programSlug,
          userId: args.userId,
        });
      }
    }

    if (plans.length === 0 && hadContentLoadFailure) {
      return EMPTY_RESULT;
    }

    if (args.shouldAbort?.()) {
      return EMPTY_RESULT;
    }

    return args.notificationService.scheduleProgramNotificationPlans(
      plans,
      buildNotificationScheduleOptions(args.now, args.access, args.shouldAbort)
    );
  } catch (error) {
    console.warn('Failed to reschedule program notifications', {
      error,
      programSlug,
      userId: args.userId,
    });
    return EMPTY_RESULT;
  }
}

async function scheduleFreeDetoxNotifications(args: RescheduleProgramNotificationsArgs & {
  notificationsEnabled: boolean;
  now: Date;
  notificationService: NotificationRuntimeService;
  userId: string;
}): Promise<ScheduleProgramNotificationsResult> {
  if (!args.profile?.free_tier_activated_at) {
    if (isAccessBootstrapPending(args.access)) {
      return EMPTY_RESULT;
    }

    return args.notificationService.scheduleProgramNotificationPlans(
      [],
      buildNotificationScheduleOptions(args.now, args.access, args.shouldAbort)
    );
  }

  try {
    const hasPaidAccess = await (args.loadHasPaidProgramAccess ?? loadHasPaidProgramAccess)(args.userId);
    if (hasPaidAccess) {
      if (isAccessBootstrapPending(args.access)) {
        return EMPTY_RESULT;
      }

      return args.notificationService.scheduleProgramNotificationPlans(
        [],
        buildNotificationScheduleOptions(args.now, args.access, args.shouldAbort)
      );
    }

    const progress =
      (await (args.loadFreeDetoxProgress ?? loadFreeDetoxProgress)(args.userId)) ??
      createEmptyFreeDetoxProgress(args.userId);

    if (progress.completedAt || progress.completedDays.includes(FREE_DETOX_TOTAL_DAYS)) {
      return args.notificationService.scheduleProgramNotificationPlans(
        [],
        buildNotificationScheduleOptions(args.now, args.access, args.shouldAbort)
      );
    }

    const currentDay = getNextFreeDetoxDay(progress);
    const access: NotificationRuntimeAccess = {
      ownedProgram: FREE_DETOX_PROGRAM_SLUG,
      purchaseState: 'owned_active',
      completionState: 'in_progress',
      programState: 'active',
      currentDay,
      scheduledStartDate: null,
      pausedAt: null,
      completedAt: null,
    };
    const plans = [];
    let hadContentLoadFailure = false;

    for (const scheduleDay of getRollingScheduleDays(access, args.now)) {
      try {
        const dayContent = await (args.loadDayContent ?? loadNotificationDayContent)(
          FREE_DETOX_PROGRAM_SLUG,
          scheduleDay.dayNumber
        );
        if (!dayContent) {
          continue;
        }

        const day = resolveDay({
          contentMode: 'unique',
          dayContent,
          dayNumber: scheduleDay.dayNumber,
          programSlug: FREE_DETOX_PROGRAM_SLUG,
        });
        const notificationTemplates = await loadNotificationTemplates({
          dayNumber: scheduleDay.dayNumber,
          programSlug: FREE_DETOX_PROGRAM_SLUG,
          userId: args.userId,
        });

        const isCurrentProgramDay = scheduleDay.dayNumber === currentDay;

        plans.push(
          ...buildProgramNotificationPlan({
            access: {
              ...access,
              currentDay: scheduleDay.dayNumber,
            },
            consecutiveAbsentDays: null,
            day,
            notificationsEnabled: args.notificationsEnabled,
            notificationTemplates,
            now: args.now,
            openedToday: resolveOpenedTodayForScheduleDay({
              openedToday: args.openedToday,
              isCurrentProgramDay,
            }),
            programName: PROGRAM_METADATA[FREE_DETOX_PROGRAM_SLUG].name,
            scheduleDate: scheduleDay.scheduleDate,
          })
        );
      } catch (dayError) {
        hadContentLoadFailure = true;
        console.warn('Skipping Free Detox notification plan for day with unavailable content', {
          dayNumber: scheduleDay.dayNumber,
          error: dayError,
          programSlug: FREE_DETOX_PROGRAM_SLUG,
          userId: args.userId,
        });
      }
    }

    if (plans.length === 0 && hadContentLoadFailure) {
      return EMPTY_RESULT;
    }

    if (args.shouldAbort?.()) {
      return EMPTY_RESULT;
    }

    return args.notificationService.scheduleProgramNotificationPlans(
      plans,
      buildNotificationScheduleOptions(args.now, access, args.shouldAbort)
    );
  } catch (error) {
    console.warn('Failed to reschedule Free Detox notifications', {
      error,
      programSlug: FREE_DETOX_PROGRAM_SLUG,
      userId: args.userId,
    });
    return EMPTY_RESULT;
  }
}

function getRollingScheduleDays(access: NotificationRuntimeAccess, now: Date) {
  if (access.programState === 'paused') {
    return [
      {
        dayNumber: access.currentDay ?? 1,
        scheduleDate: getScheduleBaseDate(access, now),
      },
    ];
  }

  const programSlug = access.ownedProgram;
  const currentDay = access.currentDay ?? 1;
  const totalDays = programSlug ? PROGRAM_METADATA[programSlug].totalDays : currentDay;
  const baseDate = getScheduleBaseDate(access, now);
  const finalDay = Math.min(totalDays, currentDay + ROLLING_NOTIFICATION_DAYS - 1);

  return Array.from({ length: finalDay - currentDay + 1 }, (_, index) => ({
    dayNumber: currentDay + index,
    scheduleDate: addLocalDays(baseDate, index),
  }));
}

function getScheduleBaseDate(access: NotificationRuntimeAccess, now: Date) {
  if (access.programState === 'scheduled' && access.scheduledStartDate) {
    return parseLocalDate(access.scheduledStartDate, now);
  }

  return getEffectiveScheduleDate(now);
}

function addLocalDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function parseLocalDate(value: string, fallback: Date) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getEffectiveScheduleDate(fallback);
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

async function loadNotificationTemplates(args: {
  dayNumber: number;
  programSlug: ProgramSlug;
  userId: string;
}): Promise<NotificationTemplateOverrides | undefined> {
  try {
    const { data: templateData, error: templateError } = await supabase
      .from('notification_templates')
      .select('notification_type, program_slug, title_template, body_template, trigger_hour, trigger_minute')
      .eq('is_enabled', true)
      .in('program_slug', ['global', args.programSlug]);

    if (templateError) {
      throw templateError;
    }

    const { data: variantData, error: variantError } = await supabase
      .from('notification_template_variants')
      .select('notification_type, program_slug, variant_key, title_template, body_template, weight')
      .eq('is_enabled', true)
      .in('program_slug', ['global', args.programSlug]);

    const variantRows = variantError
      ? []
      : ((variantData ?? []) as unknown as NotificationTemplateVariantRow[]);

    const rows = ((templateData ?? []) as unknown as NotificationTemplateRow[]).sort((a, b) => {
      if (a.program_slug === b.program_slug) return 0;
      if (a.program_slug === 'global') return -1;
      return 1;
    });
    const templates: NotificationTemplateOverrides = {};

    for (const row of rows) {
      const notificationType = normalizeNotificationPlanType(row.notification_type);
      if (!notificationType) {
        continue;
      }

      templates[notificationType] = {
        bodyTemplate: row.body_template,
        titleTemplate: row.title_template,
        triggerTime:
          typeof row.trigger_hour === 'number' && typeof row.trigger_minute === 'number'
            ? { hour: row.trigger_hour, minute: row.trigger_minute }
            : null,
      };
    }

    const selectedVariants = selectNotificationTemplateVariants({
      dayNumber: args.dayNumber,
      programSlug: args.programSlug,
      rows: variantRows,
      userId: args.userId,
    });

    for (const [notificationType, variant] of Object.entries(selectedVariants)) {
      const normalizedType = normalizeNotificationPlanType(notificationType);
      if (!normalizedType) {
        continue;
      }

      templates[normalizedType] = {
        ...templates[normalizedType],
        bodyTemplate: variant.body_template,
        titleTemplate: variant.title_template,
        variantKey: variant.variant_key,
      };
    }

    return templates;
  } catch (error) {
    // Copy/timing rows should be editable, but scheduling must still work if the
    // local DB is stale or the templates migration has not been applied yet.
    console.warn('Falling back to built-in notification templates', { error, programSlug: args.programSlug });
    return undefined;
  }
}

function selectNotificationTemplateVariants(args: {
  dayNumber: number;
  programSlug: ProgramSlug;
  rows: NotificationTemplateVariantRow[];
  userId: string;
}): Partial<Record<NotificationPlanType, NotificationTemplateVariantRow>> {
  const groupedRows = new Map<NotificationPlanType, NotificationTemplateVariantRow[]>();

  for (const row of args.rows) {
    const notificationType = normalizeNotificationPlanType(row.notification_type);
    if (!notificationType) {
      continue;
    }

    const current = groupedRows.get(notificationType) ?? [];
    groupedRows.set(notificationType, [...current, row]);
  }

  const selected: Partial<Record<NotificationPlanType, NotificationTemplateVariantRow>> = {};

  for (const [notificationType, rows] of groupedRows) {
    const programRows = rows.filter((row) => row.program_slug === args.programSlug);
    const applicableRows = (programRows.length > 0
      ? programRows
      : rows.filter((row) => row.program_slug === 'global')
    ).sort((a, b) => a.variant_key.localeCompare(b.variant_key));

    if (applicableRows.length === 0) {
      continue;
    }

    const weightedRows = expandWeightedRows(applicableRows);
    const seed = `${args.userId}:${args.programSlug}:${args.dayNumber}:${notificationType}`;
    selected[notificationType] = weightedRows[stableHash(seed) % weightedRows.length];
  }

  return selected;
}

function expandWeightedRows(rows: NotificationTemplateVariantRow[]) {
  return rows.flatMap((row) => {
    const weight = typeof row.weight === 'number' && row.weight > 0 ? row.weight : 1;
    return Array.from({ length: weight }, () => row);
  });
}

function stableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalizeNotificationPlanType(value: string): NotificationPlanType | null {
  const validTypes: NotificationPlanType[] = [
    'morning_session_ready',
    'afternoon_check_in',
    'evening_routine',
    'missed_morning_catch_up',
    'day_completed',
    'partial_day',
    'absence_waiting',
    'absence_last_active',
    'paused_reentry',
    'paused_daily_reminder',
  ];

  return validTypes.includes(value as NotificationPlanType) ? (value as NotificationPlanType) : null;
}

function isAccessBootstrapPending(access: NotificationRuntimeAccess) {
  return (
    !access.ownedProgram &&
    access.purchaseState === 'not_owned' &&
    access.completionState === 'not_started' &&
    access.programState === 'not_owned'
  );
}

function isSchedulableAccess(access: NotificationRuntimeAccess) {
  if (!access.ownedProgram || !access.currentDay) {
    return false;
  }

  if (access.completedAt || access.completionState === 'completed') {
    return false;
  }

  if (access.purchaseState !== 'owned_active') {
    return false;
  }

  const programState = access.programState ?? 'active';
  return programState === 'active' || programState === 'scheduled' || programState === 'paused';
}

async function loadNotificationDayContent(
  programSlug: ProgramSlug,
  dayNumber: number
): Promise<DayContent | null> {
  const { data: programData, error: programError } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', programSlug)
    .maybeSingle();

  if (programError) {
    throw programError;
  }

  const programRow = (programData as unknown as ProgramRow | null) ?? null;
  if (!programRow) {
    return getFallbackDay(programSlug, dayNumber);
  }

  if (getProgramContentMode(programRow) === 'template') {
    const [{ data: templateData, error: templateError }, { data: progressionData, error: progressionError }] =
      await Promise.all([
        supabase.from('program_templates').select('*').eq('program_slug', programSlug).maybeSingle(),
        supabase
          .from('program_progressions')
          .select('*')
          .eq('program_slug', programSlug)
          .eq('day_number', dayNumber)
          .maybeSingle(),
      ]);

    if (templateError) {
      throw templateError;
    }

    if (progressionError) {
      throw progressionError;
    }

    const templateRow = (templateData as unknown as ProgramTemplateRow | null) ?? null;
    const progressionRow = (progressionData as unknown as ProgramProgressionRow | null) ?? null;

    return templateRow && progressionRow
      ? resolveTemplateDayRow(programSlug, templateRow, progressionRow)
      : getFallbackDay(programSlug, dayNumber);
  }

  const { data: dayData, error: dayError } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_slug', programSlug)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (dayError) {
    throw dayError;
  }

  const dayRow = (dayData as unknown as ProgramDayRow | null) ?? null;
  return dayRow ? mapProgramDayRowToDayContent(dayRow, programSlug) : getFallbackDay(programSlug, dayNumber);
}

async function loadNotificationDayStates(
  userId: string,
  programSlug: ProgramSlug
): Promise<NotificationRuntimeDayState[]> {
  const { data, error } = await supabase
    .from('user_day_states')
    .select('day_number, day_state, cards_completed, cards_total, card_details')
    .eq('user_id', userId)
    .eq('program_slug', programSlug)
    .order('day_number', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as {
    day_number: number;
    day_state: string;
    cards_completed: number;
    cards_total: number;
    card_details: unknown;
  }[]).map((row) => ({
    dayNumber: row.day_number,
    dayState: row.day_state === 'completed' || row.day_state === 'partial' ? row.day_state : 'skipped',
    cardsCompleted: row.cards_completed ?? 0,
    cardsTotal: row.cards_total ?? 0,
    cardDetails: parseNotificationCardDetails(row.card_details),
  }));
}

function parseNotificationCardDetails(value: unknown): DayStateCardDetail[] {
  return Array.isArray(value) ? (value as DayStateCardDetail[]) : [];
}

function buildDayCompletionFromState(
  day: NotificationPlannerDay,
  dayStateRow: NotificationRuntimeDayState
): DayCompletionNotificationState {
  return {
    dayState: dayStateRow.dayState,
    completedCount: dayStateRow.cardsCompleted,
    totalCount: dayStateRow.cardsTotal || day.cards.length,
  };
}

function getCompletedCardIndexes(dayStateRow: NotificationRuntimeDayState) {
  return dayStateRow.cardDetails
    .filter((detail) => detail.outcome === 'completed')
    .map((detail) => detail.card_index);
}

function resolveOpenedTodayForScheduleDay(args: {
  openedToday?: boolean;
  isCurrentProgramDay: boolean;
}) {
  if (!args.isCurrentProgramDay) {
    // Rolling future program days only schedule tier-1 card reminders.
    return true;
  }

  return args.openedToday ?? false;
}

async function loadHasPaidProgramAccess(userId: string) {
  const { data, error } = await supabase
    .from('program_access')
    .select('id')
    .eq('user_id', userId)
    .neq('owned_program', FREE_DETOX_PROGRAM_SLUG)
    .neq('purchase_state', 'not_owned')
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data?.length);
}
