import { supabase } from '@/lib/supabase';
import type { RoutineEffortLevel, RoutineProgressRecord } from '@/lib/routine-progress';
import type { ContentCard, DayContent, ProgramSlug } from '@/types/content';
import type { Json } from '@/types/database.types';
import type { CardState, DayState, TimeSlot } from '@/types/resolver';
import { isMissingAnyColumnError } from '@/lib/db-compat';

type RuntimeCard = ContentCard & {
  timeSlot?: TimeSlot;
  isTimeSensitive?: boolean;
  hasEffortCheck?: boolean;
};

type DayStateOutcome = Extract<DayState, 'completed' | 'partial' | 'skipped'>;
type CardOutcome = Extract<CardState, 'completed' | 'skipped' | 'blocked'>;

export interface DayStateCardDetail {
  card_id: string;
  card_index: number;
  card_type: ContentCard['type'];
  title: string | null;
  time_slot: TimeSlot;
  is_time_sensitive: boolean;
  has_effort_check: boolean;
  opened: boolean;
  outcome: CardOutcome;
  effort_check_value?: RoutineEffortLevel | null;
}

export interface UserDayStateUpsert {
  user_id: string;
  program_slug: ProgramSlug;
  day_number: number;
  day_state: DayStateOutcome;
  cards_opened: number;
  cards_completed: number;
  cards_total: number;
  completion_percentage: number;
  card_details: DayStateCardDetail[];
  finalized_at: string;
}

export interface BuildUserDayStateRecordArgs {
  userId: string;
  day: DayContent;
  requestedDayState: DayStateOutcome;
  currentIndex?: number;
  cardStates?: CardState[];
  routineProgressByIndex?: Record<number, RoutineProgressRecord>;
  finalizedAt?: string;
}

const DEFAULT_TIME_SLOT_META = {
  timeSlot: 'anytime' as const,
  isTimeSensitive: false,
  hasEffortCheck: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getRuntimeMeta(card: ContentCard) {
  const runtimeCard = card as RuntimeCard;

  return {
    timeSlot: runtimeCard.timeSlot ?? DEFAULT_TIME_SLOT_META.timeSlot,
    isTimeSensitive: runtimeCard.isTimeSensitive ?? DEFAULT_TIME_SLOT_META.isTimeSensitive,
    hasEffortCheck: runtimeCard.hasEffortCheck ?? DEFAULT_TIME_SLOT_META.hasEffortCheck,
  };
}

function getRoutineItemKey(name: string, index: number) {
  return `${name}-${index}`;
}

function isSingleExerciseRoutine(card: Extract<ContentCard, { type: 'exercise_routine' }>) {
  return Boolean(card.name && Array.isArray(card.steps));
}

function isRoutineComplete(
  card: Extract<ContentCard, { type: 'exercise_routine' }>,
  hasEffortCheck: boolean,
  routineProgress: RoutineProgressRecord | undefined
) {
  const completedItems = new Set(routineProgress?.completedItems ?? []);
  const requiredItems = isSingleExerciseRoutine(card)
    ? [card.name as string]
    : (card.exercises ?? []).map((item, index) => getRoutineItemKey(item.name, index));

  const effortCheckSatisfied = !(hasEffortCheck && isSingleExerciseRoutine(card))
    || (routineProgress?.effortLevel ?? null) !== null;

  return requiredItems.every((itemKey) => completedItems.has(itemKey)) && effortCheckSatisfied;
}

function getCardTitle(card: ContentCard) {
  switch (card.type) {
    case 'intro':
      return card.dayTitle;
    case 'lesson':
      return card.title ?? null;
    case 'action_step':
    case 'breathing_exercise':
    case 'mindfulness_exercise':
    case 'audio':
      return card.title ?? null;
    case 'exercise_routine':
      return card.title ?? card.name ?? null;
    case 'journal':
      return card.prompt;
    case 'calm_trigger':
      return card.context;
    case 'close':
      return card.message;
  }
}

function isCardCompletedForPartialDay(args: {
  card: ContentCard;
  cardState: CardState | undefined;
  hasEffortCheck: boolean;
  opened: boolean;
  routineProgress: RoutineProgressRecord | undefined;
}) {
  if (!args.opened) {
    return false;
  }

  if (args.cardState === 'locked' || args.cardState === 'blocked' || args.cardState === 'skipped') {
    return false;
  }

  if (args.card.type === 'close') {
    return false;
  }

  if (args.card.type === 'exercise_routine') {
    return isRoutineComplete(args.card, args.hasEffortCheck, args.routineProgress);
  }

  return true;
}

export function buildUserDayStateRecord(args: BuildUserDayStateRecordArgs): UserDayStateUpsert {
  const cardsTotal = args.day.cards.length;
  const hasIncompleteRequiredRoutine = args.day.cards.some((card, index) => {
    if (card.type !== 'exercise_routine') {
      return false;
    }

    const meta = getRuntimeMeta(card);
    return !isRoutineComplete(card, meta.hasEffortCheck, args.routineProgressByIndex?.[index]);
  });
  const effectiveRequestedDayState =
    args.requestedDayState === 'completed' && hasIncompleteRequiredRoutine
      ? 'partial'
      : args.requestedDayState;
  const openedThroughIndex =
    effectiveRequestedDayState === 'completed'
      ? cardsTotal - 1
      : clamp(args.currentIndex ?? -1, -1, Math.max(cardsTotal - 1, -1));

  const cardDetails = args.day.cards.map((card, index): DayStateCardDetail => {
    const meta = getRuntimeMeta(card);
    const cardState = args.cardStates?.[index];
    const opened = effectiveRequestedDayState === 'completed' || index <= openedThroughIndex;
    const completed = effectiveRequestedDayState === 'completed'
      ? true
      : effectiveRequestedDayState === 'skipped'
        ? false
        : isCardCompletedForPartialDay({
            card,
            cardState,
            hasEffortCheck: meta.hasEffortCheck,
            opened,
            routineProgress: args.routineProgressByIndex?.[index],
          });
    const outcome = completed ? 'completed' : cardState === 'blocked' ? 'blocked' : 'skipped';
    const routineProgress = card.type === 'exercise_routine'
      ? args.routineProgressByIndex?.[index]
      : undefined;

    return {
      card_id: `${args.day.programSlug}:${args.day.dayNumber}:${index}:${card.type}`,
      card_index: index,
      card_type: card.type,
      title: getCardTitle(card),
      time_slot: meta.timeSlot,
      is_time_sensitive: meta.isTimeSensitive,
      has_effort_check: meta.hasEffortCheck,
      opened,
      outcome,
      ...(routineProgress ? { effort_check_value: routineProgress.effortLevel } : {}),
    };
  });

  const cardsCompleted = cardDetails.filter((detail) => detail.outcome === 'completed').length;
  const cardsOpened = cardDetails.filter((detail) => detail.opened).length;
  const dayState: DayStateOutcome =
    cardsTotal > 0 && cardsCompleted === cardsTotal
      ? 'completed'
      : cardsCompleted > 0
        ? 'partial'
        : 'skipped';
  const completionPercentage = cardsTotal > 0
    ? Number(((cardsCompleted / cardsTotal) * 100).toFixed(2))
    : 0;

  return {
    user_id: args.userId,
    program_slug: args.day.programSlug,
    day_number: args.day.dayNumber,
    day_state: dayState,
    cards_opened: cardsOpened,
    cards_completed: cardsCompleted,
    cards_total: cardsTotal,
    completion_percentage: completionPercentage,
    card_details: cardDetails,
    finalized_at: args.finalizedAt ?? new Date().toISOString(),
  };
}

export async function upsertUserDayState(record: UserDayStateUpsert) {
  const { error } = await supabase
    .from('user_day_states')
    .upsert(
      {
        ...record,
        card_details: record.card_details as unknown as Json,
      },
      { onConflict: 'user_id,program_slug,day_number' }
    );

  if (error && isMissingAnyColumnError(error, ['cards_opened', 'completion_percentage'])) {
    const {
      cards_opened: _cardsOpened,
      completion_percentage: _completionPercentage,
      ...legacyRecord
    } = record;

    const { error: legacyError } = await supabase
      .from('user_day_states')
      .upsert(
        {
          ...legacyRecord,
          card_details: legacyRecord.card_details as unknown as Json,
        },
        { onConflict: 'user_id,program_slug,day_number' }
      );

    if (legacyError) {
      throw legacyError;
    }
    return;
  }

  if (error) {
    throw error;
  }
}
