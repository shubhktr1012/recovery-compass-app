import { describe, expect, it, vi } from 'vitest';

import { buildWidgetPayload } from '@/lib/widget-bridge';
import type { ProgramAccessSnapshot, ProgramProgressRecord } from '@/lib/programs/types';

vi.mock('react-native', () => ({
  NativeModules: {},
  Platform: { OS: 'ios' },
}));

const access: ProgramAccessSnapshot = {
  ownerUserId: 'user-1',
  ownedProgram: 'age_reversal',
  purchaseState: 'owned_active',
  completionState: 'in_progress',
  currentDay: 1,
  startedAt: '2026-05-17T07:00:00.000Z',
  completedAt: null,
  archivedAt: null,
  eligibleProducts: [],
  source: 'local',
};

const progress: ProgramProgressRecord = {
  userId: 'user-1',
  programSlug: 'age_reversal',
  currentDay: 1,
  completedDays: [],
  partialDays: [],
  completedAt: null,
  archivedAt: null,
  updatedAt: '2026-05-17T07:00:00.000Z',
};

describe('buildWidgetPayload', () => {
  it('does not lock day one before the first overnight boundary date', () => {
    const payload = buildWidgetPayload({
      access,
      progress,
      now: new Date('2026-05-17T01:01:00'),
    });

    expect(payload?.currentDay).toBe(1);
    expect(payload?.isSessionLocked).toBe(false);
  });

  it('keeps the current day active before the 1 AM finalization boundary', () => {
    const payload = buildWidgetPayload({
      access,
      progress,
      now: new Date('2026-05-18T00:59:00'),
    });

    expect(payload?.currentDay).toBe(1);
    expect(payload?.isSessionLocked).toBe(false);
    expect(payload?.isDayCompleted).toBe(false);
  });

  it('shows the next day as locked during the 1 AM to 5 AM overnight gap', () => {
    const payload = buildWidgetPayload({
      access,
      progress,
      now: new Date('2026-05-18T02:30:00'),
    });

    expect(payload?.currentDay).toBe(2);
    expect(payload?.isSessionLocked).toBe(true);
    expect(payload?.availabilityLabel).toContain('5:00 AM');
  });

  it('unlocks the next day at 5 AM', () => {
    const payload = buildWidgetPayload({
      access,
      progress,
      now: new Date('2026-05-18T05:00:00'),
    });

    expect(payload?.currentDay).toBe(2);
    expect(payload?.isSessionLocked).toBe(false);
    expect(payload?.isDayCompleted).toBe(false);
  });
});
