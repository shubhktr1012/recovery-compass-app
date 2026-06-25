import type { ContentCard, ProgramSlug } from '@/types/content';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';
import type { DayState, ResolvedContentCard, TimeSlot } from '@/types/resolver';

export type NotificationTier =
  | 'card_reminder'
  | 'missed_card_nudge'
  | 'completion_motivation'
  | 'absence_reengagement';

export type NotificationPlanType =
  | 'morning_session_ready'
  | 'afternoon_check_in'
  | 'evening_routine'
  | 'missed_morning_catch_up'
  | 'day_completed'
  | 'partial_day'
  | 'absence_waiting'
  | 'absence_last_active'
  | 'paused_reentry'
  | 'paused_daily_reminder';

export interface NotificationPlan {
  id: string;
  tier: NotificationTier;
  type: NotificationPlanType;
  title: string;
  body: string;
  triggerAt: Date;
  repeats?: 'daily';
  data: {
    notificationTier: NotificationTier;
    notificationType: NotificationPlanType;
    programSlug: ProgramSlug;
    dayNumber: number;
    cardIndex?: number;
    timeSlot?: TimeSlot;
  };
}

export interface NotificationTemplateOverride {
  bodyTemplate?: string | null;
  titleTemplate?: string | null;
  triggerTime?: {
    hour: number;
    minute: number;
  } | null;
  variantKey?: string | null;
}

export type NotificationTemplateOverrides = Partial<
  Record<NotificationPlanType, NotificationTemplateOverride>
>;

export interface NotificationPlannerDay {
  programSlug: ProgramSlug;
  dayNumber: number;
  dayTitle: string;
  cards: ResolvedContentCard[];
}

export interface DayCompletionNotificationState {
  dayState: DayState;
  completedCount: number;
  totalCount: number;
  streakCount?: number;
}

export interface BuildProgramNotificationPlanArgs {
  access: Pick<
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
  day: NotificationPlannerDay;
  programName: string;
  notificationsEnabled: boolean;
  now?: Date;
  scheduleDate?: Date;
  openedToday?: boolean;
  completedCardIndexes?: number[];
  dayCompletion?: DayCompletionNotificationState | null;
  consecutiveAbsentDays?: number | null;
  notificationTemplates?: NotificationTemplateOverrides;
  /** When true, Tier 1 reminders repeat daily (survives reschedule after trigger time). */
  repeatTierOneDaily?: boolean;
}

const MORNING_REMINDER_TIME = { hour: 6, minute: 30 };
const AFTERNOON_REMINDER_TIME = { hour: 12, minute: 0 };
const EVENING_REMINDER_TIME = { hour: 19, minute: 0 };
const MISSED_CARD_NUDGE_TIME = { hour: 14, minute: 15 };
const PARTIAL_DAY_MOTIVATION_TIME = { hour: 21, minute: 0 };
const MANUAL_PAUSE_REMINDER_TIME = { hour: 9, minute: 0 };

export function buildProgramNotificationPlan(
  args: BuildProgramNotificationPlanArgs
): NotificationPlan[] {
  const now = args.now ?? new Date();

  if (!isNotificationEligibleAccess(args)) {
    return [];
  }

  if (args.access.programState === 'paused') {
    const pausePlan = buildManualPauseNotificationPlan(args, now);
    return pausePlan ? [pausePlan] : [];
  }

  const absencePlan = buildAbsenceNotificationPlan(args, now);
  if (absencePlan) {
    return isFutureNotification(absencePlan, now) ? [absencePlan] : [];
  }

  if (shouldStaySilentForAbsence(args.consecutiveAbsentDays)) {
    return [];
  }

  return [
    ...buildTierOneCardReminders(args, now),
    ...buildTierTwoMissedCardNudge(args, now),
    ...buildTierThreeCompletionMotivation(args, now),
  ];
}

function isNotificationEligibleAccess(args: BuildProgramNotificationPlanArgs) {
  if (!args.notificationsEnabled) {
    return false;
  }

  if (args.access.ownedProgram !== args.day.programSlug) {
    return false;
  }

  if (
    typeof args.access.currentDay === 'number' &&
    args.access.currentDay !== args.day.dayNumber
  ) {
    return false;
  }

  if (args.access.purchaseState !== 'owned_active') {
    return false;
  }

  if (args.access.completedAt || args.access.completionState === 'completed') {
    return false;
  }

  const programState = args.access.programState ?? 'active';
  if (programState === 'active' || programState === 'scheduled') {
    return true;
  }

  return programState === 'paused';
}

function buildManualPauseNotificationPlan(
  args: BuildProgramNotificationPlanArgs,
  now: Date
): NotificationPlan | null {
  const copy = resolveNotificationCopy({
    args,
    type: 'paused_daily_reminder',
    fallbackTitle: `${args.programName} is paused`,
    fallbackBody: 'Your journey is still saved. Tap when you are ready to continue from the same day.',
    variables: {
      dayNumber: args.day.dayNumber,
      dayTitle: args.day.dayTitle,
      programName: args.programName,
    },
  });

  return createPlan({
    args,
    tier: 'absence_reengagement',
    type: 'paused_daily_reminder',
    title: copy.title,
    body: copy.body,
    triggerAt: getNextDailyTriggerDate(now, MANUAL_PAUSE_REMINDER_TIME),
    repeats: 'daily',
  });
}

function buildTierOneCardReminders(
  args: BuildProgramNotificationPlanArgs,
  now: Date
): NotificationPlan[] {
  if (args.dayCompletion) {
    return [];
  }

  const plans: NotificationPlan[] = [];
  const totalSteps = args.day.cards.length;
  const morningCopy = resolveNotificationCopy({
    args,
    type: 'morning_session_ready',
    fallbackTitle: `${args.programName} is ready`,
    fallbackBody: `Good morning. Your ${args.programName} session is ready. ${totalSteps} steps today.`,
    variables: {
      dayNumber: args.day.dayNumber,
      dayTitle: args.day.dayTitle,
      programName: args.programName,
      totalSteps,
    },
  });

  plans.push(
    createPlan({
      args,
      tier: 'card_reminder',
      type: 'morning_session_ready',
      title: morningCopy.title,
      body: morningCopy.body,
      triggerAt: args.repeatTierOneDaily
        ? getNextDailyTriggerDate(now, args.notificationTemplates?.morning_session_ready?.triggerTime ?? MORNING_REMINDER_TIME)
        : getConfiguredTriggerDate(args, 'morning_session_ready', MORNING_REMINDER_TIME),
      timeSlot: 'morning',
      repeats: args.repeatTierOneDaily ? 'daily' : undefined,
    })
  );

  const afternoonCard = findFirstCardForSlot(args.day.cards, 'afternoon');
  if (afternoonCard) {
    const afternoonCopy = resolveNotificationCopy({
      args,
      type: 'afternoon_check_in',
      fallbackTitle: `${args.programName} check-in`,
      fallbackBody: `Your ${args.programName} afternoon check-in is ready. ${afternoonCard.title} is waiting.`,
      variables: {
        cardTitle: afternoonCard.title,
        dayNumber: args.day.dayNumber,
        dayTitle: args.day.dayTitle,
        programName: args.programName,
      },
    });

    plans.push(
      createPlan({
        args,
        tier: 'card_reminder',
        type: 'afternoon_check_in',
        title: afternoonCopy.title,
        body: afternoonCopy.body,
        triggerAt: args.repeatTierOneDaily
          ? getNextDailyTriggerDate(now, args.notificationTemplates?.afternoon_check_in?.triggerTime ?? AFTERNOON_REMINDER_TIME)
          : getConfiguredTriggerDate(args, 'afternoon_check_in', AFTERNOON_REMINDER_TIME),
        cardIndex: afternoonCard.index,
        timeSlot: 'afternoon',
        repeats: args.repeatTierOneDaily ? 'daily' : undefined,
      })
    );
  }

  const eveningCard = findFirstCardForSlot(args.day.cards, 'evening');
  if (eveningCard) {
    const eveningCopy = resolveNotificationCopy({
      args,
      type: 'evening_routine',
      fallbackTitle: `${args.programName} evening routine`,
      fallbackBody: `Your ${args.programName} evening routine is ready. Wind down with ${eveningCard.title}.`,
      variables: {
        cardTitle: eveningCard.title,
        dayNumber: args.day.dayNumber,
        dayTitle: args.day.dayTitle,
        programName: args.programName,
      },
    });

    plans.push(
      createPlan({
        args,
        tier: 'card_reminder',
        type: 'evening_routine',
        title: eveningCopy.title,
        body: eveningCopy.body,
        triggerAt: args.repeatTierOneDaily
          ? getNextDailyTriggerDate(now, args.notificationTemplates?.evening_routine?.triggerTime ?? EVENING_REMINDER_TIME)
          : getConfiguredTriggerDate(args, 'evening_routine', EVENING_REMINDER_TIME),
        cardIndex: eveningCard.index,
        timeSlot: 'evening',
        repeats: args.repeatTierOneDaily ? 'daily' : undefined,
      })
    );
  }

  return plans.filter((plan) => plan.repeats === 'daily' || isFutureNotification(plan, now)).slice(0, 3);
}

function buildTierTwoMissedCardNudge(
  args: BuildProgramNotificationPlanArgs,
  now: Date
): NotificationPlan[] {
  if (args.dayCompletion || args.openedToday !== false) {
    return [];
  }

  const completedCardIndexes = new Set(args.completedCardIndexes ?? []);
  const catchUpCards = args.day.cards.filter(
    (card, index) =>
      card.timeSlot === 'morning' &&
      !card.isTimeSensitive &&
      !completedCardIndexes.has(index)
  );

  if (catchUpCards.length === 0) {
    return [];
  }

  const copy = resolveNotificationCopy({
    args,
    type: 'missed_morning_catch_up',
    fallbackTitle: `${args.programName} catch-up available`,
    fallbackBody: `You missed your ${args.programName} morning session. ${catchUpCards.length} cards are still available to catch up on.`,
    variables: {
      catchUpCount: catchUpCards.length,
      dayNumber: args.day.dayNumber,
      dayTitle: args.day.dayTitle,
      programName: args.programName,
    },
  });

  const plan = createPlan({
    args,
    tier: 'missed_card_nudge',
    type: 'missed_morning_catch_up',
    title: copy.title,
    body: copy.body,
    triggerAt: getConfiguredTriggerDate(args, 'missed_morning_catch_up', MISSED_CARD_NUDGE_TIME),
  });

  return isFutureNotification(plan, now) ? [plan] : [];
}

function buildTierThreeCompletionMotivation(
  args: BuildProgramNotificationPlanArgs,
  now: Date
): NotificationPlan[] {
  const completion = args.dayCompletion;
  if (!completion || completion.dayState === 'skipped') {
    return [];
  }

  if (completion.dayState === 'completed') {
    const completedBody = formatCompletedDayBody(args.day.dayNumber, completion.streakCount);
    const copy = resolveNotificationCopy({
      args,
      type: 'day_completed',
      fallbackTitle: `Day ${args.day.dayNumber} complete`,
      fallbackBody: completedBody,
      variables: {
        completedBody,
        dayNumber: args.day.dayNumber,
        dayTitle: args.day.dayTitle,
        programName: args.programName,
        streakCount: completion.streakCount ?? 0,
        streakText: formatStreakText(completion.streakCount),
      },
    });

    return [
      createPlan({
        args,
        tier: 'completion_motivation',
        type: 'day_completed',
        title: copy.title,
        body: copy.body,
        triggerAt: now,
      }),
    ];
  }

  const partialCopy = resolveNotificationCopy({
    args,
    type: 'partial_day',
    fallbackTitle: `${args.programName} progress saved`,
    fallbackBody: `You got through ${completion.completedCount} of ${completion.totalCount} cards today. Every step counts.`,
    variables: {
      completedCount: completion.completedCount,
      dayNumber: args.day.dayNumber,
      dayTitle: args.day.dayTitle,
      programName: args.programName,
      totalCount: completion.totalCount,
    },
  });

  const plan = createPlan({
    args,
    tier: 'completion_motivation',
    type: 'partial_day',
    title: partialCopy.title,
    body: partialCopy.body,
    triggerAt: getConfiguredTriggerDate(args, 'partial_day', PARTIAL_DAY_MOTIVATION_TIME),
  });

  return isFutureNotification(plan, now) ? [plan] : [];
}

function buildAbsenceNotificationPlan(
  args: BuildProgramNotificationPlanArgs,
  now: Date
): NotificationPlan | null {
  const consecutiveAbsentDays = args.consecutiveAbsentDays ?? 0;

  if (consecutiveAbsentDays <= 0) {
    return null;
  }

  if (shouldStaySilentForAbsence(consecutiveAbsentDays)) {
    return null;
  }

  if (shouldSendPausedReentry(consecutiveAbsentDays)) {
    const copy = resolveNotificationCopy({
      args,
      type: 'paused_reentry',
      fallbackTitle: `${args.programName} is paused`,
      fallbackBody: 'Your program is paused and waiting. No pressure. Tap to pick up where you left off.',
      variables: {
        dayNumber: args.day.dayNumber,
        dayTitle: args.day.dayTitle,
        programName: args.programName,
      },
    });

    return createPlan({
      args,
      tier: 'absence_reengagement',
      type: 'paused_reentry',
      title: copy.title,
      body: copy.body,
      triggerAt: getConfiguredTriggerDate(args, 'paused_reentry', MORNING_REMINDER_TIME),
    });
  }

  if (consecutiveAbsentDays === 2) {
    const copy = resolveNotificationCopy({
      args,
      type: 'absence_last_active',
      fallbackTitle: `${args.programName} is saved`,
      fallbackBody: 'It has been a few days. Your progress is saved. Pick up whenever you are ready.',
      variables: {
        dayNumber: args.day.dayNumber,
        dayTitle: args.day.dayTitle,
        programName: args.programName,
      },
    });

    return createPlan({
      args,
      tier: 'absence_reengagement',
      type: 'absence_last_active',
      title: copy.title,
      body: copy.body,
      triggerAt: getConfiguredTriggerDate(args, 'absence_last_active', MORNING_REMINDER_TIME),
    });
  }

  const copy = resolveNotificationCopy({
    args,
    type: 'absence_waiting',
    fallbackTitle: `${args.programName} is waiting`,
    fallbackBody: `Your ${args.programName} session is waiting. Day ${args.day.dayNumber} is ready.`,
    variables: {
      dayNumber: args.day.dayNumber,
      dayTitle: args.day.dayTitle,
      programName: args.programName,
    },
  });

  return createPlan({
    args,
    tier: 'absence_reengagement',
    type: 'absence_waiting',
    title: copy.title,
    body: copy.body,
    triggerAt: getConfiguredTriggerDate(args, 'absence_waiting', MORNING_REMINDER_TIME),
  });
}

function shouldSendPausedReentry(consecutiveAbsentDays: number | null | undefined) {
  const absentDays = consecutiveAbsentDays ?? 0;
  return absentDays >= 3 && absentDays <= 4;
}

function shouldStaySilentForAbsence(consecutiveAbsentDays: number | null | undefined) {
  return (consecutiveAbsentDays ?? 0) >= 5;
}

function createPlan(params: {
  args: BuildProgramNotificationPlanArgs;
  tier: NotificationTier;
  type: NotificationPlanType;
  title: string;
  body: string;
  triggerAt: Date;
  repeats?: 'daily';
  cardIndex?: number;
  timeSlot?: TimeSlot;
}): NotificationPlan {
  const { args, cardIndex, repeats, timeSlot, tier, triggerAt, type } = params;

  return {
    id: buildNotificationId({
      programSlug: args.day.programSlug,
      dayNumber: args.day.dayNumber,
      type,
    }),
    tier,
    type,
    title: params.title,
    body: params.body,
    triggerAt,
    ...(repeats ? { repeats } : {}),
    data: {
      notificationTier: tier,
      notificationType: type,
      programSlug: args.day.programSlug,
      dayNumber: args.day.dayNumber,
      ...(typeof cardIndex === 'number' ? { cardIndex } : {}),
      ...(timeSlot ? { timeSlot } : {}),
    },
  };
}

function buildNotificationId(params: {
  programSlug: ProgramSlug;
  dayNumber: number;
  type: NotificationPlanType;
}) {
  return `program:${params.programSlug}:day:${params.dayNumber}:${params.type}`;
}

function getTriggerDate(
  args: BuildProgramNotificationPlanArgs,
  time: { hour: number; minute: number }
) {
  const scheduleDate = getLocalScheduleDate(args);
  return new Date(
    scheduleDate.getFullYear(),
    scheduleDate.getMonth(),
    scheduleDate.getDate(),
    time.hour,
    time.minute,
    0,
    0
  );
}

function getConfiguredTriggerDate(
  args: BuildProgramNotificationPlanArgs,
  type: NotificationPlanType,
  fallbackTime: { hour: number; minute: number }
) {
  return getTriggerDate(args, args.notificationTemplates?.[type]?.triggerTime ?? fallbackTime);
}

function getNextDailyTriggerDate(now: Date, time: { hour: number; minute: number }) {
  const triggerAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    time.hour,
    time.minute,
    0,
    0
  );

  if (triggerAt.getTime() <= now.getTime()) {
    triggerAt.setDate(triggerAt.getDate() + 1);
  }

  return triggerAt;
}

function getLocalScheduleDate(args: BuildProgramNotificationPlanArgs) {
  if (args.scheduleDate) {
    return startOfLocalDate(args.scheduleDate);
  }

  if (args.access.programState === 'scheduled' && args.access.scheduledStartDate) {
    return parseLocalDate(args.access.scheduledStartDate);
  }

  return startOfLocalDate(args.now ?? new Date());
}

function parseLocalDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return startOfLocalDate(new Date());
    }

    return startOfLocalDate(parsed);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function resolveNotificationCopy(args: {
  args: BuildProgramNotificationPlanArgs;
  fallbackBody: string;
  fallbackTitle: string;
  type: NotificationPlanType;
  variables: Record<string, string | number | null | undefined>;
}) {
  const template = args.args.notificationTemplates?.[args.type];

  return {
    title: renderNotificationTemplate(template?.titleTemplate ?? args.fallbackTitle, args.variables),
    body: renderNotificationTemplate(template?.bodyTemplate ?? args.fallbackBody, args.variables),
  };
}

function renderNotificationTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value === null || typeof value === 'undefined' ? match : String(value);
  });
}

function isFutureNotification(plan: NotificationPlan, now: Date) {
  return plan.triggerAt.getTime() > now.getTime();
}

function findFirstCardForSlot(cards: ResolvedContentCard[], timeSlot: TimeSlot) {
  const index = cards.findIndex((card) => card.timeSlot === timeSlot);
  if (index < 0) {
    return null;
  }

  return {
    index,
    title: getCardTitle(cards[index]),
  };
}

function getCardTitle(card: ContentCard) {
  switch (card.type) {
    case 'intro':
      return card.dayTitle;
    case 'lesson':
      return card.title ?? "today's lesson";
    case 'action_step':
    case 'breathing_exercise':
    case 'mindfulness_exercise':
    case 'audio':
      return card.title;
    case 'exercise_routine':
      return card.title ?? card.name ?? "today's routine";
    case 'journal':
      return card.prompt;
    case 'calm_trigger':
      return card.context;
    case 'close':
      return card.message;
  }
}

function formatCompletedDayBody(dayNumber: number, streakCount: number | undefined) {
  if (streakCount && streakCount > 0) {
    return `Day ${dayNumber} complete. ${streakCount}-day streak.`;
  }

  return `Day ${dayNumber} complete. Your progress is saved.`;
}

function formatStreakText(streakCount: number | undefined) {
  return streakCount && streakCount > 0 ? `${streakCount}-day streak.` : 'Your progress is saved.';
}
