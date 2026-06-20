import { PROGRAM_UNLOCK_HOUR } from '@/lib/programs/schedule';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';

export const ABSENCE_PAUSE_THRESHOLD_DAYS = 3;
export const ABSENCE_PAUSE_RECENT_RESUME_GRACE_MS = 24 * 60 * 60 * 1000;

type FinalizedDayStateLike = {
  dayNumber: number;
  dayState: string;
};

function clampDayNumber(dayNumber: number, totalDays: number) {
  return Math.min(totalDays, Math.max(1, dayNumber));
}

export function getLatestConsecutiveSkippedDayCount(dayStates: FinalizedDayStateLike[]) {
  const sortedStates = [...dayStates]
    .filter((dayState) => Number.isFinite(dayState.dayNumber))
    .sort((left, right) => right.dayNumber - left.dayNumber);
  const latestDayNumber = sortedStates[0]?.dayNumber ?? 0;
  let expectedDayNumber = latestDayNumber;
  let skippedCount = 0;

  for (const dayState of sortedStates) {
    if (dayState.dayNumber !== expectedDayNumber || dayState.dayState !== 'skipped') {
      break;
    }

    skippedCount += 1;
    expectedDayNumber -= 1;
  }

  return skippedCount;
}

export function getPauseDayNumberForAbsence(
  dayStates: FinalizedDayStateLike[],
  totalDays: number,
  threshold = ABSENCE_PAUSE_THRESHOLD_DAYS
) {
  const sortedStates = [...dayStates]
    .filter((dayState) => Number.isFinite(dayState.dayNumber))
    .sort((left, right) => left.dayNumber - right.dayNumber);
  const latestDayNumber = sortedStates.at(-1)?.dayNumber ?? 0;

  if (latestDayNumber <= 0 || getLatestConsecutiveSkippedDayCount(sortedStates) < threshold) {
    return null;
  }

  return clampDayNumber(latestDayNumber + 1, totalDays);
}

export function shouldEvaluateAbsencePause(access: ProgramAccessSnapshot) {
  return Boolean(
    access.ownedProgram &&
    access.purchaseState !== 'not_owned' &&
    access.completionState !== 'completed' &&
    access.programState !== 'paused' &&
    access.startedAt
  );
}

export function shouldSuppressAbsencePauseAfterRecentResume(
  access: ProgramAccessSnapshot,
  pauseDayNumber: number,
  now = new Date()
) {
  if (
    access.programState !== 'active' ||
    access.pausedAt ||
    typeof access.currentDay !== 'number' ||
    pauseDayNumber !== access.currentDay ||
    !access.updatedAt
  ) {
    return false;
  }

  const updatedAt = new Date(access.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return false;
  }

  return now.getTime() - updatedAt.getTime() < ABSENCE_PAUSE_RECENT_RESUME_GRACE_MS;
}

export function getResumeStartedAtForDay(dayNumber: number, now = new Date()) {
  const safeDayNumber = Math.max(1, Math.round(dayNumber));
  const resumedStartAt = new Date(now);
  resumedStartAt.setHours(PROGRAM_UNLOCK_HOUR, 0, 0, 0);
  resumedStartAt.setDate(resumedStartAt.getDate() - (safeDayNumber - 1));

  return resumedStartAt;
}
