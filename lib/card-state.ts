import type { CardState, TimeSlot } from '@/types/resolver';

import { TIME_SLOT_WINDOWS } from '@/types/resolver';

export interface CardStateInput {
  timeSlot: TimeSlot;
  isTimeSensitive: boolean;
}

export interface CardCompletionRecord {
  state?: Extract<CardState, 'completed' | 'skipped'> | null;
  completedAt?: string | null;
  skippedAt?: string | null;
}

export interface ProgramRuntimeCardStateInput {
  card: CardStateInput;
  currentTime: Date | string;
  isDayCompleted: boolean;
  isFutureLocked: boolean;
  isHistoricalReadOnlyDay: boolean;
  timeSlotsEnabled: boolean;
}

export type WindowPhase = 'before_open' | 'open' | 'after_close';

export function toLocalHHMM(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  });
}

export function isWindowOpen(slot: TimeSlot, currentHHMM: string): boolean {
  return getWindowPhase(slot, currentHHMM) === 'open';
}

export function getWindowPhase(slot: TimeSlot, currentHHMM: string): WindowPhase {
  assertValidHHMM(currentHHMM);

  const { opens, closes } = TIME_SLOT_WINDOWS[slot];

  if (opens <= closes) {
    if (currentHHMM < opens) {
      return 'before_open';
    }

    if (currentHHMM >= closes) {
      return 'after_close';
    }

    return 'open';
  }

  if (currentHHMM >= opens || currentHHMM < closes) {
    return 'open';
  }

  return 'before_open';
}

export function getCardState(
  card: CardStateInput,
  currentTime: Date | string,
  completionRecord?: CardCompletionRecord | null
): CardState {
  const terminalState = getRecordedTerminalState(completionRecord);
  if (terminalState) {
    return terminalState;
  }

  const currentHHMM = typeof currentTime === 'string' ? currentTime : toLocalHHMM(currentTime);
  const windowPhase = getWindowPhase(card.timeSlot, currentHHMM);

  switch (windowPhase) {
    case 'open':
      return 'available';
    case 'before_open':
      return 'locked';
    case 'after_close':
      return card.isTimeSensitive ? 'blocked' : 'catch_up';
  }
}

export function getProgramRuntimeCardState({
  card,
  currentTime,
  isDayCompleted,
  isFutureLocked,
  isHistoricalReadOnlyDay,
  timeSlotsEnabled,
}: ProgramRuntimeCardStateInput): CardState {
  if (isFutureLocked) {
    return 'locked';
  }

  if (isDayCompleted) {
    return 'completed';
  }

  if (isHistoricalReadOnlyDay) {
    return 'skipped';
  }

  if (!timeSlotsEnabled) {
    return 'available';
  }

  return getCardState(card, currentTime);
}

function getRecordedTerminalState(
  completionRecord?: CardCompletionRecord | null
): Extract<CardState, 'completed' | 'skipped'> | null {
  if (!completionRecord) {
    return null;
  }

  if (completionRecord.state === 'completed' || completionRecord.completedAt) {
    return 'completed';
  }

  if (completionRecord.state === 'skipped' || completionRecord.skippedAt) {
    return 'skipped';
  }

  return null;
}

function assertValidHHMM(value: string): void {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`Invalid time value "${value}". Expected HH:MM.`);
  }
}
