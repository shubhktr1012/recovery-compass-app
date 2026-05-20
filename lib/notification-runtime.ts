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
  type NotificationPlanType,
  type NotificationTemplateOverrides,
} from '@/lib/notification-scheduler';
import { NotificationService, type ScheduleProgramNotificationsResult } from '@/lib/notifications';
import { getLatestConsecutiveSkippedDayCount } from '@/lib/programs/absence';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';
import { supabase } from '@/lib/supabase';
import type { DayContent, ProgramSlug } from '@/types/content';
import type { DayState } from '@/types/resolver';
import { resolveDay } from '@/lib/card-resolver';

type NotificationRuntimeProfile = {
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
  loadDayContent?: (programSlug: ProgramSlug, dayNumber: number) => Promise<DayContent | null>;
  loadDayStates?: (userId: string, programSlug: ProgramSlug) => Promise<NotificationRuntimeDayState[]>;
  notificationService?: NotificationRuntimeService;
}

const EMPTY_RESULT: ScheduleProgramNotificationsResult = {
  cancelledIds: [],
  scheduledIds: [],
};

export async function rescheduleProgramNotificationsForAccess(
  args: RescheduleProgramNotificationsArgs
): Promise<ScheduleProgramNotificationsResult> {
  const notificationService = args.notificationService ?? NotificationService;
  const now = args.now ?? new Date();
  const notificationsEnabled = Boolean(
    args.profile?.notifications_enabled || args.profile?.push_opt_in
  );

  if (!notificationsEnabled || !args.userId || !isSchedulableAccess(args.access)) {
    return notificationService.scheduleProgramNotificationPlans([], { now });
  }

  const programSlug = args.access.ownedProgram;
  const dayNumber = args.access.currentDay;

  if (!programSlug || !dayNumber) {
    return notificationService.scheduleProgramNotificationPlans([], { now });
  }

  try {
    const dayContent = await (args.loadDayContent ?? loadNotificationDayContent)(programSlug, dayNumber);
    if (!dayContent) {
      return notificationService.scheduleProgramNotificationPlans([], { now });
    }

    const day = resolveDay({
      contentMode: 'unique',
      dayContent,
      dayNumber,
      programSlug,
    });
    const dayStates = await (args.loadDayStates ?? loadNotificationDayStates)(args.userId, programSlug);
    const consecutiveAbsentDays = getLatestConsecutiveSkippedDayCount(dayStates);
    const notificationTemplates = await loadNotificationTemplates({
      dayNumber,
      programSlug,
      userId: args.userId,
    });
    const plans = buildProgramNotificationPlan({
      access: args.access,
      consecutiveAbsentDays,
      day,
      notificationsEnabled,
      notificationTemplates,
      now,
      openedToday: args.openedToday ?? true,
      programName: PROGRAM_METADATA[programSlug].name,
    });

    return notificationService.scheduleProgramNotificationPlans(plans, { now });
  } catch (error) {
    console.warn('Failed to reschedule program notifications', {
      error,
      programSlug,
      userId: args.userId,
    });
    return EMPTY_RESULT;
  }
}

async function loadNotificationTemplates(args: {
  dayNumber: number;
  programSlug: ProgramSlug;
  userId: string;
}): Promise<NotificationTemplateOverrides | undefined> {
  try {
    const { data: templateData, error: templateError } = await (supabase as any)
      .from('notification_templates')
      .select('notification_type, program_slug, title_template, body_template, trigger_hour, trigger_minute')
      .eq('is_enabled', true)
      .in('program_slug', ['global', args.programSlug]);

    if (templateError) {
      throw templateError;
    }

    const { data: variantData, error: variantError } = await (supabase as any)
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
  ];

  return validTypes.includes(value as NotificationPlanType) ? (value as NotificationPlanType) : null;
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
    .select('day_number, day_state')
    .eq('user_id', userId)
    .eq('program_slug', programSlug)
    .order('day_number', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as { day_number: number; day_state: string }[]).map((row) => ({
    dayNumber: row.day_number,
    dayState: row.day_state === 'completed' || row.day_state === 'partial' ? row.day_state : 'skipped',
  }));
}
