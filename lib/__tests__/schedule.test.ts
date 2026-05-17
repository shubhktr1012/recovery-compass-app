import { describe, expect, it } from 'vitest';

import {
  getProgramActiveDay,
  getProgramLastFinalizedDay,
  getProgramNextUnlockAt,
  getProgramScheduledDay,
  isProgramDayFinalized,
} from '@/lib/programs/schedule';

const STARTED_AT = '2026-05-17T07:00:00.000Z';

describe('program schedule helpers', () => {
  it('unlocks new days at 5:00 AM local time', () => {
    expect(getProgramScheduledDay(STARTED_AT, 90, new Date('2026-05-18T04:59:00'))).toBe(1);
    expect(getProgramScheduledDay(STARTED_AT, 90, new Date('2026-05-18T05:00:00'))).toBe(2);
  });

  it('finalizes the current day at 1:00 AM local time', () => {
    expect(getProgramLastFinalizedDay(STARTED_AT, 90, new Date('2026-05-18T00:59:00'))).toBe(0);
    expect(getProgramLastFinalizedDay(STARTED_AT, 90, new Date('2026-05-18T01:00:00'))).toBe(1);
  });

  it('reports no active day between 1:00 AM and 5:00 AM after a day has finalized', () => {
    expect(getProgramActiveDay(STARTED_AT, 90, new Date('2026-05-18T00:30:00'))).toBe(1);
    expect(getProgramActiveDay(STARTED_AT, 90, new Date('2026-05-18T02:30:00'))).toBeNull();
    expect(getProgramActiveDay(STARTED_AT, 90, new Date('2026-05-18T05:15:00'))).toBe(2);
  });

  it('marks finalized days correctly', () => {
    expect(isProgramDayFinalized(STARTED_AT, 90, 1, new Date('2026-05-18T02:30:00'))).toBe(true);
    expect(isProgramDayFinalized(STARTED_AT, 90, 2, new Date('2026-05-18T02:30:00'))).toBe(false);
  });

  it('keeps the next unlock pointed at 5:00 AM during the overnight gap', () => {
    expect(
      getProgramNextUnlockAt(STARTED_AT, 90, new Date('2026-05-18T02:30:00'))
    ).toBe(new Date('2026-05-18T05:00:00').toISOString());
  });
});
