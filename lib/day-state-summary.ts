import type { DayState } from '@/types/resolver';

export type FinalizedDayState = {
  dayNumber: number;
  dayState: Extract<DayState, 'completed' | 'partial' | 'skipped'>;
  cardsOpened: number;
  cardsCompleted: number;
  cardsTotal: number;
  completionPercentage: number;
  finalizedAt: string | null;
};

export type DayStateProgressSummary = {
  completedDays: number[];
  partialDays: number[];
  skippedDays: number[];
  currentStreak: number;
  bestStreak: number;
};

export type RollingCompletionSummary = {
  daysCount: number;
  cardsCompleted: number;
  cardsTotal: number;
  completionPercentage: number;
};

export function buildDayStateProgressSummary(dayStates: FinalizedDayState[]): DayStateProgressSummary {
  const sortedStates = [...dayStates].sort((left, right) => left.dayNumber - right.dayNumber);
  const completedDays = sortedStates
    .filter((dayState) => dayState.dayState === 'completed')
    .map((dayState) => dayState.dayNumber);
  const partialDays = sortedStates
    .filter((dayState) => dayState.dayState === 'partial')
    .map((dayState) => dayState.dayNumber);
  const skippedDays = sortedStates
    .filter((dayState) => dayState.dayState === 'skipped')
    .map((dayState) => dayState.dayNumber);

  const stateByDay = new Map(sortedStates.map((dayState) => [dayState.dayNumber, dayState.dayState]));
  const latestFinalizedDay = sortedStates.at(-1)?.dayNumber ?? 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  for (const dayState of sortedStates) {
    if (dayState.dayState === 'completed') {
      runningStreak += 1;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  for (let dayNumber = latestFinalizedDay; dayNumber >= 1; dayNumber -= 1) {
    if (stateByDay.get(dayNumber) !== 'completed') {
      break;
    }

    currentStreak += 1;
  }

  return {
    completedDays,
    partialDays,
    skippedDays,
    currentStreak,
    bestStreak,
  };
}

export function buildRollingCompletionSummary(
  dayStates: FinalizedDayState[],
  maxDays = 7
): RollingCompletionSummary {
  const recentStates = [...dayStates]
    .filter((dayState) => dayState.cardsTotal > 0)
    .sort((left, right) => left.dayNumber - right.dayNumber)
    .slice(-Math.max(1, maxDays));
  const cardsCompleted = recentStates.reduce(
    (total, dayState) => total + Math.max(0, dayState.cardsCompleted),
    0
  );
  const cardsTotal = recentStates.reduce(
    (total, dayState) => total + Math.max(0, dayState.cardsTotal),
    0
  );
  const completionPercentage = cardsTotal > 0
    ? Math.round((cardsCompleted / cardsTotal) * 100)
    : 0;

  return {
    daysCount: recentStates.length,
    cardsCompleted,
    cardsTotal,
    completionPercentage,
  };
}

export function formatFinalizedDaySummary(dayState: FinalizedDayState) {
  const safePercentage = Number.isFinite(dayState.completionPercentage)
    ? dayState.completionPercentage
    : 0;
  const percentage = Number.isInteger(safePercentage)
    ? String(safePercentage)
    : safePercentage.toFixed(2).replace(/\.?0+$/, '');
  const cardLabel = dayState.cardsTotal === 1 ? 'card' : 'cards';

  return `${dayState.cardsCompleted} of ${dayState.cardsTotal} ${cardLabel} completed (${percentage}%).`;
}
