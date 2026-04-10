export const PROGRAM_UNLOCK_HOUR = 5;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getEffectiveScheduleDate(now: Date = new Date()) {
  const effective = new Date(now);

  if (effective.getHours() < PROGRAM_UNLOCK_HOUR) {
    effective.setDate(effective.getDate() - 1);
  }

  return startOfLocalDate(effective);
}

export function getProgramScheduledDay(
  startedAt: string | Date | null | undefined,
  totalDays: number,
  now: Date = new Date()
) {
  if (totalDays <= 1) return 1;

  const parsedStart = parseDate(startedAt);
  if (!parsedStart) return 1;

  const startDate = startOfLocalDate(parsedStart);
  const effectiveDate = getEffectiveScheduleDate(now);
  const dayDelta = Math.floor((effectiveDate.getTime() - startDate.getTime()) / MS_PER_DAY);

  return clamp(dayDelta + 1, 1, totalDays);
}

export function getProgramNextUnlockAt(
  startedAt: string | Date | null | undefined,
  totalDays: number,
  now: Date = new Date()
) {
  const parsedStart = parseDate(startedAt);
  if (!parsedStart) return null;

  const scheduledDay = getProgramScheduledDay(parsedStart, totalDays, now);
  if (scheduledDay >= totalDays) {
    return null;
  }

  const startDate = startOfLocalDate(parsedStart);
  const nextUnlockDate = addLocalDays(startDate, scheduledDay);
  nextUnlockDate.setHours(PROGRAM_UNLOCK_HOUR, 0, 0, 0);

  return nextUnlockDate.toISOString();
}

export function formatUnlockLabel(nextUnlockAt: string | null | undefined, now: Date = new Date()) {
  if (!nextUnlockAt) return null;

  const unlockDate = parseDate(nextUnlockAt);
  if (!unlockDate) return null;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isTomorrow =
    unlockDate.getFullYear() === tomorrow.getFullYear() &&
    unlockDate.getMonth() === tomorrow.getMonth() &&
    unlockDate.getDate() === tomorrow.getDate();

  const timeLabel = unlockDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isTomorrow) {
    return `Your next step unlocks tomorrow at ${timeLabel}`;
  }

  const dateLabel = unlockDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return `Your next step unlocks ${dateLabel} at ${timeLabel}`;
}
