import { describe, expect, it } from 'vitest';

import {
  getCardState,
  getProgramRuntimeCardState,
  getWindowPhase,
  isWindowOpen,
  toLocalHHMM,
  type CardStateInput,
} from '@/lib/card-state';

const morningCatchUpCard: CardStateInput = {
  timeSlot: 'morning',
  isTimeSensitive: false,
};

const morningStrictCard: CardStateInput = {
  timeSlot: 'morning',
  isTimeSensitive: true,
};

const eveningCard: CardStateInput = {
  timeSlot: 'evening',
  isTimeSensitive: true,
};

const anytimeCard: CardStateInput = {
  timeSlot: 'anytime',
  isTimeSensitive: false,
};

describe('getWindowPhase', () => {
  it('treats normal windows as before_open, open, or after_close', () => {
    expect(getWindowPhase('morning', '04:45')).toBe('before_open');
    expect(getWindowPhase('morning', '09:00')).toBe('open');
    expect(getWindowPhase('morning', '15:00')).toBe('after_close');
  });

  it('treats cross-midnight windows as open in the late evening and after midnight', () => {
    expect(getWindowPhase('evening', '18:30')).toBe('before_open');
    expect(getWindowPhase('evening', '20:00')).toBe('open');
    expect(getWindowPhase('evening', '00:30')).toBe('open');
  });

  it('throws on invalid HH:MM input', () => {
    expect(() => getWindowPhase('morning', '9:00')).toThrow('Expected HH:MM');
  });
});

describe('getCardState', () => {
  it('returns locked before a card window opens', () => {
    expect(getCardState(morningCatchUpCard, '04:30')).toBe('locked');
    expect(getCardState(eveningCard, '11:00')).toBe('locked');
    expect(getCardState(anytimeCard, '04:30')).toBe('locked');
  });

  it('returns available while the window is open', () => {
    expect(getCardState(morningCatchUpCard, '09:00')).toBe('available');
    expect(getCardState(eveningCard, '20:00')).toBe('available');
    expect(getCardState(eveningCard, '00:30')).toBe('available');
    expect(getCardState(anytimeCard, '10:00')).toBe('available');
  });

  it('returns catch_up after close for non-time-sensitive cards', () => {
    expect(getCardState(morningCatchUpCard, '15:00')).toBe('catch_up');
  });

  it('returns blocked after close for time-sensitive cards', () => {
    expect(getCardState(morningStrictCard, '15:00')).toBe('blocked');
  });

  it('prefers completed and skipped records over clock-based state', () => {
    expect(
      getCardState(morningStrictCard, '04:30', {
        completedAt: '2026-05-15T08:00:00.000Z',
      })
    ).toBe('completed');

    expect(
      getCardState(morningCatchUpCard, '09:00', {
        skippedAt: '2026-05-16T01:00:00.000Z',
      })
    ).toBe('skipped');
  });

  it('supports explicit terminal state values for future persisted records', () => {
    expect(getCardState(anytimeCard, '10:00', { state: 'completed' })).toBe('completed');
    expect(getCardState(anytimeCard, '10:00', { state: 'skipped' })).toBe('skipped');
  });
});

describe('getProgramRuntimeCardState', () => {
  it('disables clock-based gating for non-time-slotted programs', () => {
    expect(
      getProgramRuntimeCardState({
        card: morningStrictCard,
        currentTime: '15:00',
        isDayCompleted: false,
        isFutureLocked: false,
        isHistoricalReadOnlyDay: false,
        timeSlotsEnabled: false,
      })
    ).toBe('available');

    expect(
      getProgramRuntimeCardState({
        card: anytimeCard,
        currentTime: '04:30',
        isDayCompleted: false,
        isFutureLocked: false,
        isHistoricalReadOnlyDay: false,
        timeSlotsEnabled: false,
      })
    ).toBe('available');
  });

  it('keeps lifecycle locks even when time slots are disabled', () => {
    expect(
      getProgramRuntimeCardState({
        card: anytimeCard,
        currentTime: '10:00',
        isDayCompleted: false,
        isFutureLocked: true,
        isHistoricalReadOnlyDay: false,
        timeSlotsEnabled: false,
      })
    ).toBe('locked');
  });

  it('preserves clock-based gating for time-slotted programs', () => {
    expect(
      getProgramRuntimeCardState({
        card: morningStrictCard,
        currentTime: '15:00',
        isDayCompleted: false,
        isFutureLocked: false,
        isHistoricalReadOnlyDay: false,
        timeSlotsEnabled: true,
      })
    ).toBe('blocked');
  });
});

describe('shared time helpers', () => {
  it('reports window openness consistently', () => {
    expect(isWindowOpen('afternoon', '13:00')).toBe(true);
    expect(isWindowOpen('afternoon', '19:00')).toBe(false);
  });

  it('formats local time as HH:MM', () => {
    expect(toLocalHHMM(new Date())).toMatch(/^\d{2}:\d{2}$/);
  });
});
