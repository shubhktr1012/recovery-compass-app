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
    expect(payload?.progressDayCount).toBe(0);
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
    expect(payload?.progressDayCount).toBe(0);
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
    expect(payload?.progressDayCount).toBe(0);
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
    expect(payload?.progressDayCount).toBe(0);
  });

  it('does not treat stale current_day as earned future widget progress', () => {
    const payload = buildWidgetPayload({
      access: {
        ...access,
        currentDay: 12,
      },
      progress: {
        ...progress,
        currentDay: 12,
        completedDays: [1],
      },
      now: new Date('2026-05-18T05:00:00'),
    });

    expect(payload?.currentDay).toBe(2);
    expect(payload?.isSessionLocked).toBe(false);
    expect(payload?.streak).toBe(1);
    expect(payload?.progressDayCount).toBe(1);
  });

  it('counts finalized partial days as earned widget progress without advancing the shown day', () => {
    const payload = buildWidgetPayload({
      access: {
        ...access,
        currentDay: 12,
      },
      progress: {
        ...progress,
        currentDay: 12,
        completedDays: [1],
        partialDays: [2],
      },
      now: new Date('2026-05-18T05:00:00'),
    });

    expect(payload?.currentDay).toBe(2);
    expect(payload?.isDayCompleted).toBe(false);
    expect(payload?.progressDayCount).toBe(2);
  });

  it('keeps paused programs frozen and locked at the preserved current day', () => {
    const payload = buildWidgetPayload({
      access: {
        ...access,
        currentDay: 6,
        pausedAt: '2026-05-21T10:00:00.000Z',
        programState: 'paused',
      },
      progress: {
        ...progress,
        currentDay: 6,
        completedDays: [1, 2, 3, 4, 5],
      },
      now: new Date('2026-05-25T09:00:00'),
    });

    expect(payload?.currentDay).toBe(6);
    expect(payload?.isSessionLocked).toBe(true);
    expect(payload?.availabilityLabel).toBe('Paused');
    expect(payload?.streak).toBe(5);
    expect(payload?.progressDayCount).toBe(5);
  });

  it('shows completed programs without locking the widget session', () => {
    const allDays = Array.from({ length: 90 }, (_value, index) => index + 1);
    const payload = buildWidgetPayload({
      access: {
        ...access,
        completionState: 'completed',
        completedAt: '2026-08-14T10:00:00.000Z',
        currentDay: 90,
        programState: 'completed',
        purchaseState: 'owned_completed',
      },
      progress: {
        ...progress,
        completedAt: '2026-08-14T10:00:00.000Z',
        completedDays: allDays,
        currentDay: 90,
      },
      now: new Date('2026-08-15T09:00:00'),
    });

    expect(payload?.currentDay).toBe(90);
    expect(payload?.isSessionLocked).toBe(false);
    expect(payload?.isDayCompleted).toBe(true);
    expect(payload?.progressDayCount).toBe(90);
  });

  it('keeps scheduled programs locked until their selected start date opens', () => {
    const payload = buildWidgetPayload({
      access: {
        ...access,
        programState: 'scheduled',
        scheduledStartDate: '2026-05-20',
        startedAt: '2026-05-20T05:00:00.000Z',
      },
      progress,
      now: new Date(2026, 4, 20, 4, 59),
    });

    expect(payload?.currentDay).toBe(1);
    expect(payload?.isSessionLocked).toBe(true);
    expect(payload?.availabilityLabel).toContain('5:00 AM');
    expect(payload?.progressDayCount).toBe(0);
  });
});
