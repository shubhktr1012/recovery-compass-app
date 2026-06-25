import { describe, expect, it } from 'vitest';

import {
  buildDayStateProgressSummary,
  buildRollingCompletionSummary,
  formatFinalizedDaySummary,
  type FinalizedDayState,
} from '@/lib/day-state-summary';

function day(dayNumber: number, dayState: FinalizedDayState['dayState']): FinalizedDayState {
  return {
    dayNumber,
    dayState,
    cardsOpened: 0,
    cardsCompleted: dayState === 'completed' ? 1 : 0,
    cardsTotal: 1,
    completionPercentage: dayState === 'completed' ? 100 : 0,
    finalizedAt: '2026-05-17T10:00:00.000Z',
  };
}

describe('buildDayStateProgressSummary', () => {
  it('groups completed, partial, and skipped finalized days', () => {
    const summary = buildDayStateProgressSummary([
      day(1, 'completed'),
      day(2, 'partial'),
      day(3, 'skipped'),
    ]);

    expect(summary.completedDays).toEqual([1]);
    expect(summary.partialDays).toEqual([2]);
    expect(summary.skippedDays).toEqual([3]);
    expect(summary.bestStreak).toBe(1);
  });

  it('resets the current streak when the latest finalized day is partial or skipped', () => {
    expect(buildDayStateProgressSummary([
      day(1, 'completed'),
      day(2, 'completed'),
      day(3, 'skipped'),
    ]).currentStreak).toBe(0);

    expect(buildDayStateProgressSummary([
      day(1, 'completed'),
      day(2, 'completed'),
      day(3, 'partial'),
    ]).currentStreak).toBe(0);
  });

  it('counts only consecutive completed days ending at the latest finalized day', () => {
    const summary = buildDayStateProgressSummary([
      day(1, 'completed'),
      day(2, 'partial'),
      day(3, 'completed'),
      day(4, 'completed'),
    ]);

    expect(summary.currentStreak).toBe(2);
    expect(summary.bestStreak).toBe(2);
  });

  it('builds rolling completion from the last up to 7 finalized days', () => {
    const states = Array.from({ length: 8 }, (_, index) => ({
      dayNumber: index + 1,
      dayState: 'partial' as const,
      cardsOpened: 10,
      cardsCompleted: index === 0 ? 10 : 5,
      cardsTotal: 10,
      completionPercentage: index === 0 ? 100 : 50,
      finalizedAt: '2026-05-17T10:00:00.000Z',
    }));

    expect(buildRollingCompletionSummary(states)).toEqual({
      daysCount: 7,
      cardsCompleted: 35,
      cardsTotal: 70,
      completionPercentage: 50,
    });
  });

  it('formats a compact historical day summary', () => {
    expect(formatFinalizedDaySummary({
      dayNumber: 2,
      dayState: 'partial',
      cardsOpened: 10,
      cardsCompleted: 5,
      cardsTotal: 10,
      completionPercentage: 50,
      finalizedAt: '2026-05-17T10:00:00.000Z',
    })).toBe('5 of 10 cards completed (50%).');
  });

  it('falls back safely when a stored percentage is invalid', () => {
    expect(formatFinalizedDaySummary({
      dayNumber: 2,
      dayState: 'partial',
      cardsOpened: 1,
      cardsCompleted: 0,
      cardsTotal: 1,
      completionPercentage: Number.NaN,
      finalizedAt: '2026-05-17T10:00:00.000Z',
    })).toBe('0 of 1 card completed (0%).');
  });
});
