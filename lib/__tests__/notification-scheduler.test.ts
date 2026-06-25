import { describe, expect, it } from 'vitest';

import {
  buildProgramNotificationPlan,
  type BuildProgramNotificationPlanArgs,
  type NotificationPlannerDay,
} from '@/lib/notification-scheduler';
import type { ResolvedContentCard, TimeSlot } from '@/types/resolver';

const activeAccess: BuildProgramNotificationPlanArgs['access'] = {
  ownedProgram: 'energy_vitality',
  purchaseState: 'owned_active',
  completionState: 'in_progress',
  programState: 'active',
  currentDay: 2,
  scheduledStartDate: null,
  pausedAt: null,
  completedAt: null,
};

const baseDay: NotificationPlannerDay = {
  programSlug: 'energy_vitality',
  dayNumber: 2,
  dayTitle: 'Energy Activation Upgrade',
  cards: [
    card('intro', 'anytime', false, { dayNumber: 2, dayTitle: 'Energy Activation Upgrade', goal: 'Start steady.' }),
    card('action_step', 'morning', false, { title: 'Sunlight walk', instructions: ['Walk outside.'] }),
    card('exercise_routine', 'afternoon', false, { title: 'Midday Reset', exercises: [] }),
    card('journal', 'evening', false, { prompt: 'What helped you most today?' }),
    card('close', 'evening', false, { message: 'Day 2 is complete.' }),
  ],
};

function card(
  type: ResolvedContentCard['type'],
  timeSlot: TimeSlot,
  isTimeSensitive: boolean,
  payload: Record<string, unknown>
): ResolvedContentCard {
  return {
    type,
    ...payload,
    timeSlot,
    isTimeSensitive,
    hasEffortCheck: false,
  } as ResolvedContentCard;
}

function buildPlan(
  overrides: Partial<BuildProgramNotificationPlanArgs> = {}
) {
  return buildProgramNotificationPlan({
    access: activeAccess,
    day: baseDay,
    programName: 'Energy Restore Program',
    notificationsEnabled: true,
    now: new Date(2026, 4, 19, 5, 30),
    openedToday: true,
    ...overrides,
  });
}

describe('buildProgramNotificationPlan', () => {
  it('does not plan notifications when notifications are disabled', () => {
    expect(buildPlan({ notificationsEnabled: false })).toEqual([]);
  });

  it('does not plan notifications for completed or non-owned access', () => {
    expect(
      buildPlan({
        access: {
          ...activeAccess,
          purchaseState: 'owned_completed',
          completionState: 'completed',
          programState: 'completed',
          completedAt: '2026-05-19T10:00:00.000Z',
        },
      })
    ).toEqual([]);

    expect(
      buildPlan({
        access: {
          ...activeAccess,
          ownedProgram: 'sleep_disorder_reset',
        },
      })
    ).toEqual([]);
  });

  it('does not plan notifications for a day that is not the active current day', () => {
    expect(
      buildPlan({
        day: {
          ...baseDay,
          dayNumber: 3,
        },
      })
    ).toEqual([]);
  });

  it('plans Tier 1 reminders for active day slots only when they are still upcoming', () => {
    const plan = buildPlan();

    expect(plan.map((notification) => notification.type)).toEqual([
      'morning_session_ready',
      'afternoon_check_in',
      'evening_routine',
    ]);
    expect(plan[0].triggerAt).toEqual(new Date(2026, 4, 19, 6, 30));
    expect(plan[1].triggerAt).toEqual(new Date(2026, 4, 19, 12, 0));
    expect(plan[2].triggerAt).toEqual(new Date(2026, 4, 19, 19, 0));
    expect(plan[0].body).toContain('Energy Restore Program session is ready');
    expect(plan[1].body).toContain('Midday Reset is waiting');
  });

  it('skips past slot reminders after their trigger time', () => {
    const plan = buildPlan({ now: new Date(2026, 4, 19, 12, 30) });

    expect(plan.map((notification) => notification.type)).toEqual(['evening_routine']);
  });

  it('uses the scheduled start date for a pre-start program', () => {
    const plan = buildPlan({
      access: {
        ...activeAccess,
        programState: 'scheduled',
        currentDay: 1,
        scheduledStartDate: '2026-05-20',
      },
      day: {
        ...baseDay,
        dayNumber: 1,
      },
      now: new Date(2026, 4, 19, 15, 0),
    });

    expect(plan[0].triggerAt).toEqual(new Date(2026, 4, 20, 6, 30));
  });

  it('plans the missed morning nudge only when unopened catch-up cards remain', () => {
    const plan = buildPlan({
      now: new Date(2026, 4, 19, 5, 30),
      openedToday: false,
    });

    expect(plan.some((notification) => notification.type === 'missed_morning_catch_up')).toBe(true);
    expect(
      plan.find((notification) => notification.type === 'missed_morning_catch_up')?.triggerAt
    ).toEqual(new Date(2026, 4, 19, 14, 15));
  });

  it('does not plan the missed morning nudge after the user opened the app today', () => {
    const plan = buildPlan({
      now: new Date(2026, 4, 19, 5, 30),
      openedToday: true,
    });

    expect(plan.some((notification) => notification.type === 'missed_morning_catch_up')).toBe(false);
  });

  it('does not plan the missed morning nudge for time-sensitive morning cards', () => {
    const plan = buildPlan({
      openedToday: false,
      day: {
        ...baseDay,
        cards: [
          card('intro', 'anytime', false, {
            dayNumber: 2,
            dayTitle: 'Energy Activation Upgrade',
            goal: 'Start steady.',
          }),
          card('action_step', 'morning', true, {
            title: 'Time-boxed activation',
            instructions: ['Do it in the morning.'],
          }),
        ],
      },
    });

    expect(plan.some((notification) => notification.type === 'missed_morning_catch_up')).toBe(false);
  });

  it('plans immediate completion motivation for completed days without emoji', () => {
    const plan = buildPlan({
      dayCompletion: {
        dayState: 'completed',
        completedCount: 5,
        totalCount: 5,
        streakCount: 3,
      },
    });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      tier: 'completion_motivation',
      type: 'day_completed',
      body: 'Day 2 complete. 3-day streak.',
    });
    expect(plan[0].body).not.toContain('🔥');
  });

  it('plans 9 PM motivation for partial days and stays silent for skipped days', () => {
    const partialPlan = buildPlan({
      dayCompletion: {
        dayState: 'partial',
        completedCount: 3,
        totalCount: 5,
      },
    });

    expect(partialPlan).toHaveLength(1);
    expect(partialPlan[0].type).toBe('partial_day');
    expect(partialPlan[0].triggerAt).toEqual(new Date(2026, 4, 19, 21, 0));

    expect(
      buildPlan({
        dayCompletion: {
          dayState: 'skipped',
          completedCount: 0,
          totalCount: 5,
        },
      })
    ).toEqual([]);
  });

  it('uses graduated absence notifications and then switches to a paused daily reminder', () => {
    expect(buildPlan({ consecutiveAbsentDays: 1 }).map((notification) => notification.type)).toEqual([
      'absence_waiting',
    ]);

    expect(buildPlan({ consecutiveAbsentDays: 2 }).map((notification) => notification.type)).toEqual([
      'absence_last_active',
    ]);

    expect(
      buildPlan({
        access: {
          ...activeAccess,
          programState: 'paused',
          pausedAt: '2026-05-18T19:00:00.000Z',
        },
        consecutiveAbsentDays: 3,
      }).map((notification) => notification.type)
    ).toEqual(['paused_daily_reminder']);

    expect(buildPlan({ consecutiveAbsentDays: 5 })).toEqual([]);
  });

  it('plans one repeating daily reminder while a program is manually paused', () => {
    const plan = buildPlan({
      access: {
        ...activeAccess,
        programState: 'paused',
        pausedAt: '2026-05-18T19:00:00.000Z',
      },
      now: new Date(2026, 4, 19, 9, 30),
    });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      repeats: 'daily',
      tier: 'absence_reengagement',
      type: 'paused_daily_reminder',
    });
    expect(plan[0].triggerAt).toEqual(new Date(2026, 4, 20, 9, 0));
  });

  it('keeps stable IDs and analytics-ready data payloads', () => {
    const [first] = buildPlan();

    expect(first.id).toBe('program:energy_vitality:day:2:morning_session_ready');
    expect(first.data).toEqual({
      notificationTier: 'card_reminder',
      notificationType: 'morning_session_ready',
      programSlug: 'energy_vitality',
      dayNumber: 2,
      timeSlot: 'morning',
    });
  });

  it('uses Supabase-backed template overrides when provided', () => {
    const [first] = buildPlan({
      notificationTemplates: {
        morning_session_ready: {
          titleTemplate: '{{programName}} starts now',
          bodyTemplate: 'Day {{dayNumber}} has {{totalSteps}} cards.',
          triggerTime: { hour: 7, minute: 5 },
        },
      },
    });

    expect(first.title).toBe('Energy Restore Program starts now');
    expect(first.body).toBe('Day 2 has 5 cards.');
    expect(first.triggerAt).toEqual(new Date(2026, 4, 19, 7, 5));
  });
});
