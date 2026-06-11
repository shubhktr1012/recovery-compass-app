import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NotificationPlan } from '@/lib/notification-scheduler';
import { NotificationService, getProgramNotificationTargetFromData } from '@/lib/notifications';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-device', () => ({
  isDevice: true,
}));

type ScheduledNotificationMock = {
  identifier: string;
  content: {
    title?: string;
    data?: Record<string, unknown>;
  };
};

type NotificationResponseListenerMock = (response: {
  notification: {
    request: {
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
}) => void;

function createNotificationsModule() {
  return {
    AndroidImportance: {
      HIGH: 'high',
    },
    AndroidNotificationPriority: {
      DEFAULT: 'default',
      HIGH: 'high',
    },
    SchedulableTriggerInputTypes: {
      DAILY: 'daily',
      DATE: 'date',
    },
    cancelScheduledNotificationAsync: vi.fn(async () => undefined),
    getAllScheduledNotificationsAsync: vi.fn<() => Promise<ScheduledNotificationMock[]>>(async () => []),
    getLastNotificationResponseAsync: vi.fn(async () => null),
    getPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
    addNotificationResponseReceivedListener: vi.fn((listener: NotificationResponseListenerMock) => ({ remove: vi.fn() })),
    scheduleNotificationAsync: vi.fn(async (request: { identifier?: string }) => request.identifier ?? 'scheduled-id'),
    setNotificationChannelAsync: vi.fn(async () => undefined),
    setNotificationHandler: vi.fn(),
  };
}

function createPlan(overrides: Partial<NotificationPlan> = {}): NotificationPlan {
  return {
    id: 'program:energy_vitality:day:2:morning_session_ready',
    tier: 'card_reminder',
    type: 'morning_session_ready',
    title: 'Energy Restore is ready',
    body: 'Good morning. Your Energy Restore session is ready. 5 steps today.',
    triggerAt: new Date(2026, 4, 19, 6, 30),
    data: {
      notificationTier: 'card_reminder',
      notificationType: 'morning_session_ready',
      programSlug: 'energy_vitality',
      dayNumber: 2,
      timeSlot: 'morning',
    },
    ...overrides,
  };
}

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels only Recovery Compass program notifications and the legacy 9 AM reminder', async () => {
    const notificationsModule = createNotificationsModule();
    notificationsModule.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      {
        identifier: 'program:energy_vitality:day:2:morning_session_ready',
        content: { title: 'Program reminder', data: {} },
      },
      {
        identifier: 'legacy-reminder',
        content: { title: 'Daily Progress Check-in', data: {} },
      },
      {
        identifier: 'source-tagged',
        content: { title: 'Tagged reminder', data: { source: 'recovery_compass_program' } },
      },
      {
        identifier: 'unrelated',
        content: { title: 'Keep me', data: { source: 'other' } },
      },
    ]);

    const cancelledIds = await NotificationService.cancelProgramNotifications({
      notificationsModule: notificationsModule as never,
    });

    expect(cancelledIds).toEqual([
      'program:energy_vitality:day:2:morning_session_ready',
      'legacy-reminder',
      'source-tagged',
    ]);
    expect(notificationsModule.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
    expect(notificationsModule.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('unrelated');
  });

  it('schedules notification plans with stable identifiers and analytics-ready payloads', async () => {
    const notificationsModule = createNotificationsModule();
    const plan = createPlan();

    const result = await NotificationService.scheduleProgramNotificationPlans([plan], {
      notificationsModule: notificationsModule as never,
      now: new Date(2026, 4, 19, 5, 30),
    });

    expect(result.scheduledIds).toEqual([plan.id]);
    expect(notificationsModule.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: plan.id,
      content: {
        title: plan.title,
        body: plan.body,
        data: {
          source: 'recovery_compass_program',
          planId: plan.id,
          notificationTier: 'card_reminder',
          notificationType: 'morning_session_ready',
          programSlug: 'energy_vitality',
          dayNumber: 2,
          timeSlot: 'morning',
        },
        sound: true,
        priority: 'default',
      },
      trigger: {
        type: 'date',
        date: plan.triggerAt,
        channelId: 'program-reminders',
      },
    });
  });

  it('cancels stale program reminders before scheduling the next plan set', async () => {
    const notificationsModule = createNotificationsModule();
    notificationsModule.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      {
        identifier: 'program:energy_vitality:day:1:morning_session_ready',
        content: { title: 'Old reminder', data: {} },
      },
    ]);

    await NotificationService.scheduleProgramNotificationPlans([createPlan()], {
      notificationsModule: notificationsModule as never,
      now: new Date(2026, 4, 19, 5, 30),
    });

    expect(notificationsModule.cancelScheduledNotificationAsync).toHaveBeenCalledBefore(
      notificationsModule.scheduleNotificationAsync
    );
  });

  it('uses an immediate trigger only for completion notifications that are due now', async () => {
    const notificationsModule = createNotificationsModule();
    const plan = createPlan({
      id: 'program:energy_vitality:day:2:day_completed',
      tier: 'completion_motivation',
      type: 'day_completed',
      triggerAt: new Date(2026, 4, 19, 9, 0),
      data: {
        notificationTier: 'completion_motivation',
        notificationType: 'day_completed',
        programSlug: 'energy_vitality',
        dayNumber: 2,
      },
    });

    await NotificationService.scheduleProgramNotificationPlans([plan], {
      notificationsModule: notificationsModule as never,
      now: new Date(2026, 4, 19, 9, 0),
    });

    expect(notificationsModule.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: plan.id,
        trigger: null,
      })
    );
  });

  it('schedules repeating daily paused reminders with a daily trigger', async () => {
    const notificationsModule = createNotificationsModule();
    const plan = createPlan({
      id: 'program:energy_vitality:day:2:paused_daily_reminder',
      repeats: 'daily',
      tier: 'absence_reengagement',
      type: 'paused_daily_reminder',
      triggerAt: new Date(2026, 4, 20, 9, 0),
      data: {
        notificationTier: 'absence_reengagement',
        notificationType: 'paused_daily_reminder',
        programSlug: 'energy_vitality',
        dayNumber: 2,
      },
    });

    await NotificationService.scheduleProgramNotificationPlans([plan], {
      notificationsModule: notificationsModule as never,
      now: new Date(2026, 4, 20, 9, 30),
    });

    expect(notificationsModule.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: plan.id,
        trigger: {
          type: 'daily',
          hour: 9,
          minute: 0,
          channelId: 'program-reminders',
        },
      })
    );
  });

  it('skips stale non-completion notifications', async () => {
    const notificationsModule = createNotificationsModule();

    const result = await NotificationService.scheduleProgramNotificationPlans(
      [
        createPlan({
          triggerAt: new Date(2026, 4, 19, 6, 30),
        }),
      ],
      {
        notificationsModule: notificationsModule as never,
        now: new Date(2026, 4, 19, 7, 0),
      }
    );

    expect(result.scheduledIds).toEqual([]);
    expect(notificationsModule.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('is a safe no-op when the notifications module is unavailable', async () => {
    await expect(
      NotificationService.scheduleProgramNotificationPlans([createPlan()], {
        notificationsModule: null,
      })
    ).resolves.toEqual({
      cancelledIds: [],
      scheduledIds: [],
    });
  });

  it('extracts a day-detail target from a program notification payload', () => {
    expect(
      getProgramNotificationTargetFromData({
        source: 'recovery_compass_program',
        planId: 'program:energy_vitality:day:2:morning_session_ready',
        notificationTier: 'card_reminder',
        notificationType: 'morning_session_ready',
        programSlug: 'energy_vitality',
        dayNumber: '2',
        cardIndex: 3,
        timeSlot: 'morning',
      })
    ).toEqual({
      cardIndex: 3,
      dayNumber: 2,
      notificationTier: 'card_reminder',
      notificationType: 'morning_session_ready',
      planId: 'program:energy_vitality:day:2:morning_session_ready',
      programSlug: 'energy_vitality',
      timeSlot: 'morning',
    });
  });

  it('ignores unrelated or invalid notification payloads', () => {
    expect(getProgramNotificationTargetFromData({ source: 'other' })).toBeNull();
    expect(
      getProgramNotificationTargetFromData({
        source: 'recovery_compass_program',
        programSlug: 'unknown',
        dayNumber: 2,
      })
    ).toBeNull();
    expect(
      getProgramNotificationTargetFromData({
        source: 'recovery_compass_program',
        programSlug: 'energy_vitality',
        dayNumber: 0,
      })
    ).toBeNull();
  });

  it('routes notification responses through the program target listener', async () => {
    const notificationsModule = createNotificationsModule();
    const onTarget = vi.fn();

    await NotificationService.addProgramNotificationResponseListener(onTarget, {
      notificationsModule: notificationsModule as never,
    });

    const listener = notificationsModule.addNotificationResponseReceivedListener.mock.calls[0][0];
    listener({
      notification: {
        request: {
          content: {
            data: {
              source: 'recovery_compass_program',
              programSlug: 'energy_vitality',
              dayNumber: 2,
              notificationType: 'evening_routine',
            },
          },
        },
      },
    });

    expect(onTarget).toHaveBeenCalledWith({
      dayNumber: 2,
      notificationType: 'evening_routine',
      programSlug: 'energy_vitality',
    });
  });
});
