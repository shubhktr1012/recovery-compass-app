import { describe, expect, it, vi } from 'vitest';

import { getSkippedDayNumbersForRepair } from '@/lib/day-state-repair';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('getSkippedDayNumbersForRepair', () => {
  it('returns finalized days that have no completed, partial, or durable day-state record', () => {
    const skippedDays = getSkippedDayNumbersForRepair({
      startedAt: new Date(2026, 4, 14, 5, 30),
      totalDays: 14,
      completedDays: [1],
      partialDays: [3],
      existingDayStateDays: [4],
      now: new Date(2026, 4, 18, 10),
    });

    expect(skippedDays).toEqual([2]);
  });

  it('does not repair anything before the first day has finalized', () => {
    const skippedDays = getSkippedDayNumbersForRepair({
      startedAt: new Date(2026, 4, 17, 5, 30),
      totalDays: 14,
      now: new Date(2026, 4, 17, 23, 30),
    });

    expect(skippedDays).toEqual([]);
  });

  it('does not duplicate existing skipped day-state rows', () => {
    const skippedDays = getSkippedDayNumbersForRepair({
      startedAt: new Date(2026, 4, 14, 5, 30),
      totalDays: 14,
      existingDayStateDays: [1, 2, 3, 4],
      now: new Date(2026, 4, 18, 10),
    });

    expect(skippedDays).toEqual([]);
  });
});
