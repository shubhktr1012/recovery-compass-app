import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rescheduleProgramNotificationsForAccess } from '@/lib/notification-runtime';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';
import type { DayContent } from '@/types/content';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-device', () => ({
  isDevice: true,
}));

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: supabaseMock,
}));

const activeAccess: Pick<
  ProgramAccessSnapshot,
  | 'ownedProgram'
  | 'purchaseState'
  | 'completionState'
  | 'programState'
  | 'currentDay'
  | 'scheduledStartDate'
  | 'pausedAt'
  | 'completedAt'
> = {
  ownedProgram: 'energy_vitality',
  purchaseState: 'owned_active',
  completionState: 'in_progress',
  programState: 'active',
  currentDay: 2,
  scheduledStartDate: null,
  pausedAt: null,
  completedAt: null,
};

function createDayContent(dayNumber: number): DayContent {
  return {
    programSlug: 'energy_vitality',
    dayNumber,
    dayTitle: `Energy Activation Upgrade ${dayNumber}`,
    cards: [
      {
        type: 'intro',
        dayNumber,
        dayTitle: `Energy Activation Upgrade ${dayNumber}`,
        goal: 'Start steady.',
        timeSlot: 'anytime',
        isTimeSensitive: false,
        hasEffortCheck: false,
      },
      {
        type: 'action_step',
        title: 'Sunlight walk',
        instructions: ['Walk outside.'],
        timeSlot: 'morning',
        isTimeSensitive: false,
        hasEffortCheck: false,
      },
      {
        type: 'journal',
        prompt: 'What helped you most today?',
        timeSlot: 'evening',
        isTimeSensitive: false,
        hasEffortCheck: false,
      },
    ],
  } as unknown as DayContent;
}

const dayContent = createDayContent(2);

function createNotificationService() {
  return {
    scheduleProgramNotificationPlans: vi.fn(async (plans) => ({
      cancelledIds: [],
      scheduledIds: plans.map((plan: { id: string }) => plan.id),
    })),
  };
}

function mockNotificationTemplateTables(args?: {
  templates?: unknown[];
  variants?: unknown[];
}) {
  supabaseMock.from.mockImplementation((tableName: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn(async () => ({
          data:
            tableName === 'notification_template_variants'
              ? (args?.variants ?? [])
              : (args?.templates ?? []),
          error: null,
        })),
      })),
    })),
  }));
}

describe('rescheduleProgramNotificationsForAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotificationTemplateTables();
  });

  it('builds and schedules a rolling seven-day plan from the active program day', async () => {
    const notificationService = createNotificationService();
    const loadDayContent = vi.fn(async (_programSlug: string, requestedDayNumber: number) =>
      createDayContent(requestedDayNumber)
    );

    const result = await rescheduleProgramNotificationsForAccess({
      access: activeAccess,
      loadDayContent,
      loadDayStates: vi.fn(async () => []),
      notificationService,
      now: new Date(2026, 4, 19, 5, 30),
      profile: { notifications_enabled: true },
      userId: 'user-1',
    });

    expect(loadDayContent).toHaveBeenCalledTimes(7);
    expect(result.scheduledIds).toHaveLength(14);
    expect(result.scheduledIds).toContain('program:energy_vitality:day:2:morning_session_ready');
    expect(result.scheduledIds).toContain('program:energy_vitality:day:8:morning_session_ready');
    expect(notificationService.scheduleProgramNotificationPlans).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'program:energy_vitality:day:2:morning_session_ready',
          triggerAt: new Date(2026, 4, 19, 6, 30),
          type: 'morning_session_ready',
        }),
        expect.objectContaining({
          id: 'program:energy_vitality:day:8:morning_session_ready',
          triggerAt: new Date(2026, 4, 25, 6, 30),
          type: 'morning_session_ready',
        }),
      ]),
      { now: new Date(2026, 4, 19, 5, 30) }
    );
  });

  it('uses DB-backed notification variants when available', async () => {
    const notificationService = createNotificationService();
    mockNotificationTemplateTables({
      variants: [
        {
          body_template: 'Variant copy for Day {{dayNumber}} in {{programName}}.',
          notification_type: 'morning_session_ready',
          program_slug: 'global',
          title_template: 'Variant {{programName}} title',
          variant_key: 'morning_variant',
          weight: 1,
        },
      ],
    });

    await rescheduleProgramNotificationsForAccess({
      access: activeAccess,
      loadDayContent: vi.fn(async (_programSlug: string, requestedDayNumber: number) =>
        createDayContent(requestedDayNumber)
      ),
      loadDayStates: vi.fn(async () => []),
      notificationService,
      now: new Date(2026, 4, 19, 5, 30),
      profile: { notifications_enabled: true },
      userId: 'user-1',
    });

    expect(notificationService.scheduleProgramNotificationPlans).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          body: 'Variant copy for Day 2 in 14-Day Energy Restore.',
          title: 'Variant 14-Day Energy Restore title',
          type: 'morning_session_ready',
        }),
      ]),
      { now: new Date(2026, 4, 19, 5, 30) }
    );
  });

  it('selects the same variant for repeated schedules of the same user and day', async () => {
    const firstNotificationService = createNotificationService();
    const secondNotificationService = createNotificationService();
    mockNotificationTemplateTables({
      variants: [
        {
          body_template: 'Variant A for Day {{dayNumber}}.',
          notification_type: 'morning_session_ready',
          program_slug: 'global',
          title_template: 'Variant A',
          variant_key: 'a',
          weight: 1,
        },
        {
          body_template: 'Variant B for Day {{dayNumber}}.',
          notification_type: 'morning_session_ready',
          program_slug: 'global',
          title_template: 'Variant B',
          variant_key: 'b',
          weight: 1,
        },
      ],
    });

    const scheduleArgs = {
      access: activeAccess,
      loadDayContent: vi.fn(async (_programSlug: string, requestedDayNumber: number) =>
        createDayContent(requestedDayNumber)
      ),
      loadDayStates: vi.fn(async () => []),
      now: new Date(2026, 4, 19, 5, 30),
      profile: { notifications_enabled: true },
      userId: 'user-1',
    };

    await rescheduleProgramNotificationsForAccess({
      ...scheduleArgs,
      notificationService: firstNotificationService,
    });
    await rescheduleProgramNotificationsForAccess({
      ...scheduleArgs,
      notificationService: secondNotificationService,
    });

    const firstMorningPlan = firstNotificationService.scheduleProgramNotificationPlans.mock.calls[0]?.[0]?.find(
      (plan: { type: string }) => plan.type === 'morning_session_ready'
    );
    const secondMorningPlan = secondNotificationService.scheduleProgramNotificationPlans.mock.calls[0]?.[0]?.find(
      (plan: { type: string }) => plan.type === 'morning_session_ready'
    );

    expect(firstMorningPlan?.body).toBe(secondMorningPlan?.body);
  });

  it('cancels stale program notifications when notifications are disabled', async () => {
    const notificationService = createNotificationService();
    const loadDayContent = vi.fn(async () => dayContent);

    await rescheduleProgramNotificationsForAccess({
      access: activeAccess,
      loadDayContent,
      notificationService,
      profile: { notifications_enabled: false, push_opt_in: false },
      userId: 'user-1',
    });

    expect(loadDayContent).not.toHaveBeenCalled();
    expect(notificationService.scheduleProgramNotificationPlans).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ now: expect.any(Date) })
    );
  });

  it('cancels stale program notifications when the program is already completed', async () => {
    const notificationService = createNotificationService();

    await rescheduleProgramNotificationsForAccess({
      access: {
        ...activeAccess,
        completionState: 'completed',
        completedAt: '2026-05-19T10:00:00.000Z',
        programState: 'completed',
        purchaseState: 'owned_completed',
      },
      notificationService,
      profile: { notifications_enabled: true },
      userId: 'user-1',
    });

    expect(notificationService.scheduleProgramNotificationPlans).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ now: expect.any(Date) })
    );
  });

  it('does not cancel existing notifications when content loading fails transiently', async () => {
    const notificationService = createNotificationService();

    const result = await rescheduleProgramNotificationsForAccess({
      access: activeAccess,
      loadDayContent: vi.fn(async () => {
        throw new Error('temporary content failure');
      }),
      notificationService,
      profile: { notifications_enabled: true },
      userId: 'user-1',
    });

    expect(result).toEqual({
      cancelledIds: [],
      scheduledIds: [],
    });
    expect(notificationService.scheduleProgramNotificationPlans).not.toHaveBeenCalled();
  });
});
