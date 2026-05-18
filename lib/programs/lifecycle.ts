import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { PROGRAM_UNLOCK_HOUR } from '@/lib/programs/schedule';
import type { ProgramAccessSnapshot, ProgramProgressRecord, ProgramSlug } from '@/lib/programs/types';

export type ProgramStartOption = 'today' | 'tomorrow';
export type ProgramStartRecommendationWindow =
  | 'overnight_waiting'
  | 'day_active'
  | 'late_evening';

export interface ProgramStartRecommendation {
  option: ProgramStartOption;
  window: ProgramStartRecommendationWindow;
}

function parseLocalDateString(value: string | null | undefined) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function getScheduledProgramUnlockAt(scheduledStartDate: string | null | undefined) {
  const unlockAt = parseLocalDateString(scheduledStartDate);
  if (!unlockAt) return null;

  unlockAt.setHours(PROGRAM_UNLOCK_HOUR, 0, 0, 0);
  return unlockAt;
}

export function formatLocalDateForProgramStart(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLocalProgramStartDate(option: ProgramStartOption, now: Date = new Date()) {
  const date = new Date(now);

  if (option === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  }

  return formatLocalDateForProgramStart(date);
}

export function getProgramStartRecommendation(now: Date = new Date()): ProgramStartRecommendation {
  const hour = now.getHours();

  if (hour < PROGRAM_UNLOCK_HOUR) {
    return {
      option: 'today',
      window: 'overnight_waiting',
    };
  }

  if (hour >= PROGRAM_UNLOCK_HOUR && hour < 19) {
    return {
      option: 'today',
      window: 'day_active',
    };
  }

  return {
    option: 'tomorrow',
    window: 'late_evening',
  };
}

export function isProgramStartPending(
  access: Pick<ProgramAccessSnapshot, 'programState' | 'scheduledStartDate'>,
  now: Date = new Date()
) {
  const unlockAt = getScheduledProgramUnlockAt(access.scheduledStartDate);

  if (unlockAt) {
    return now.getTime() < unlockAt.getTime();
  }

  return access.programState === 'scheduled';
}

export function getProgramScheduleStartSource(
  access: Pick<ProgramAccessSnapshot, 'startedAt' | 'scheduledStartDate'>
) {
  return getScheduledProgramUnlockAt(access.scheduledStartDate)?.toISOString() ?? access.startedAt;
}

export function formatScheduledProgramStartLabel(
  scheduledStartDate: string | null | undefined,
  now: Date = new Date()
) {
  const unlockAt = getScheduledProgramUnlockAt(scheduledStartDate);
  if (!unlockAt) return null;

  const timeLabel = unlockAt.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isToday =
    unlockAt.getFullYear() === now.getFullYear() &&
    unlockAt.getMonth() === now.getMonth() &&
    unlockAt.getDate() === now.getDate();
  const isTomorrow =
    unlockAt.getFullYear() === tomorrow.getFullYear() &&
    unlockAt.getMonth() === tomorrow.getMonth() &&
    unlockAt.getDate() === tomorrow.getDate();

  if (isToday) return `Starts today at ${timeLabel}`;
  if (isTomorrow) return `Starts tomorrow at ${timeLabel}`;

  const dateLabel = unlockAt.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });

  return `Starts ${dateLabel} at ${timeLabel}`;
}

export function isProgramProgressComplete(
  progress: Pick<ProgramProgressRecord, 'programSlug' | 'completedDays' | 'completedAt'> | null | undefined
) {
  if (!progress?.completedAt) return false;

  const programSlug = progress.programSlug as ProgramSlug;
  const totalDays = PROGRAM_METADATA[programSlug]?.totalDays;

  if (!totalDays) return false;

  return progress.completedDays.includes(totalDays);
}
