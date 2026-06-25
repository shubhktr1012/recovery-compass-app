import { Platform } from 'react-native';
import * as Device from 'expo-device';

import type { NotificationPlan, NotificationPlanType, NotificationTier } from '@/lib/notification-scheduler';
import { captureNotificationScheduleHealth } from '@/lib/monitoring';
import type { ProgramSlug } from '@/types/content';
import type { TimeSlot } from '@/types/resolver';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let hasConfiguredHandler = false;

const PROGRAM_NOTIFICATION_ID_PREFIX = 'program:';
export const PROGRAM_NOTIFICATION_CHANNEL_ID = 'program-reminders';
const PROGRAM_NOTIFICATION_SOURCE = 'recovery_compass_program';
const LEGACY_DAILY_CHECK_IN_TITLE = 'Daily Progress Check-in';
const PROGRAM_SLUGS: ProgramSlug[] = [
  'six_day_reset',
  'ninety_day_transform',
  'smoking_alcohol_quit',
  'sleep_disorder_reset',
  'energy_vitality',
  'age_reversal',
  'male_sexual_health',
  'gut_health_reset',
  'free_detox_reset',
];

interface NotificationServiceOptions {
  notificationsModule?: NotificationsModule | null;
  now?: Date;
  programState?: string | null;
  /** When true, abort before mutating scheduled notifications. */
  shouldAbort?: () => boolean;
}

export interface ScheduleProgramNotificationsResult {
  cancelledIds: string[];
  scheduledIds: string[];
}

export interface ProgramNotificationTarget {
  cardIndex?: number;
  dayNumber: number;
  notificationTier?: NotificationTier;
  notificationType?: NotificationPlanType;
  planId?: string;
  programSlug: ProgramSlug;
  timeSlot?: TimeSlot;
}

function shouldSkipNotificationsModule(): boolean {
  // expo-notifications touches keychain-backed registration state at module load.
  // On iOS Simulator that can fail when the app is missing the entitlement path
  // used for persisted remote registration info. Remote push is device-only anyway.
  return Platform.OS === 'ios' && !Device.isDevice;
}

function isNotificationQaLoggingEnabled() {
  return (
    (typeof __DEV__ !== 'undefined' && __DEV__) ||
    process.env.EXPO_PUBLIC_ENABLE_NOTIFICATION_QA_LOGS === 'true'
  );
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (shouldSkipNotificationsModule()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').then((module) => {
      if (!hasConfiguredHandler) {
        module.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        hasConfiguredHandler = true;
      }

      return module;
    });
  }

  return notificationsModulePromise;
}

async function getNotificationsModuleForService(
  options?: NotificationServiceOptions
): Promise<NotificationsModule | null> {
  if (options && 'notificationsModule' in options) {
    return options.notificationsModule ?? null;
  }

  return getNotificationsModule();
}

async function configureProgramNotificationChannel(notificationsModule: NotificationsModule) {
  if (Platform.OS !== 'android') return;

  await notificationsModule.setNotificationChannelAsync(PROGRAM_NOTIFICATION_CHANNEL_ID, {
    name: 'Program reminders',
    importance: notificationsModule.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#0A3B17',
  });
}

function isRecoveryCompassProgramNotification(notification: {
  content?: {
    data?: Record<string, unknown> | null;
    title?: string | null;
  };
  identifier?: string;
}) {
  return (
    notification.identifier?.startsWith(PROGRAM_NOTIFICATION_ID_PREFIX) ||
    notification.content?.data?.source === PROGRAM_NOTIFICATION_SOURCE ||
    notification.content?.title === LEGACY_DAILY_CHECK_IN_TITLE
  );
}

function normalizeProgramSlug(value: unknown): ProgramSlug | null {
  return typeof value === 'string' && PROGRAM_SLUGS.includes(value as ProgramSlug)
    ? (value as ProgramSlug)
    : null;
}

function normalizePositiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

function normalizeString<T extends string>(value: unknown): T | undefined {
  return typeof value === 'string' && value.length > 0 ? (value as T) : undefined;
}

export function getProgramNotificationTargetFromData(
  data: Record<string, unknown> | null | undefined
): ProgramNotificationTarget | null {
  if (!data || data.source !== PROGRAM_NOTIFICATION_SOURCE) {
    return null;
  }

  const programSlug = normalizeProgramSlug(data.programSlug);
  const dayNumber = normalizePositiveInteger(data.dayNumber);

  if (!programSlug || !dayNumber) {
    return null;
  }

  const cardIndex = normalizePositiveInteger(data.cardIndex);
  const notificationTier = normalizeString<NotificationTier>(data.notificationTier);
  const notificationType = normalizeString<NotificationPlanType>(data.notificationType);
  const planId = normalizeString(data.planId);
  const timeSlot = normalizeString<TimeSlot>(data.timeSlot);

  return {
    ...(cardIndex !== null ? { cardIndex } : {}),
    dayNumber,
    programSlug,
    ...(notificationTier ? { notificationTier } : {}),
    ...(notificationType ? { notificationType } : {}),
    ...(planId ? { planId } : {}),
    ...(timeSlot ? { timeSlot } : {}),
  };
}

function getProgramNotificationTargetFromResponse(response: {
  notification?: {
    request?: {
      content?: {
        data?: Record<string, unknown> | null;
      };
    };
  };
}) {
  return getProgramNotificationTargetFromData(response.notification?.request?.content?.data);
}

function shouldSchedulePlan(plan: NotificationPlan, now: Date) {
  if (plan.repeats === 'daily') {
    return true;
  }

  if (plan.triggerAt.getTime() > now.getTime()) {
    return true;
  }

  return plan.type === 'day_completed';
}

function getPlanTrigger(plan: NotificationPlan, notificationsModule: NotificationsModule, now: Date) {
  if (plan.repeats === 'daily') {
    return {
      type: notificationsModule.SchedulableTriggerInputTypes.DAILY,
      hour: plan.triggerAt.getHours(),
      minute: plan.triggerAt.getMinutes(),
      channelId: PROGRAM_NOTIFICATION_CHANNEL_ID,
    };
  }

  if (plan.triggerAt.getTime() <= now.getTime()) {
    return null;
  }

  return {
    type: notificationsModule.SchedulableTriggerInputTypes.DATE,
    date: plan.triggerAt,
    channelId: PROGRAM_NOTIFICATION_CHANNEL_ID,
  };
}

async function getPermissionStatusForQaLog(notificationsModule: NotificationsModule) {
  try {
    const permission = await notificationsModule.getPermissionsAsync();
    return permission.status;
  } catch {
    return 'unavailable';
  }
}

function canScheduleLocalNotifications(permissionStatus: string) {
  return permissionStatus === 'granted';
}

async function getExistingProgramNotificationIds(notificationsModule: NotificationsModule) {
  const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
  return scheduled
    .filter(isRecoveryCompassProgramNotification)
    .map((notification) => notification.identifier);
}

function reportNotificationScheduleHealth(args: {
  cancelledCount: number;
  moduleAvailable: boolean;
  permissionStatus: string;
  plans: NotificationPlan[];
  programState?: string | null;
  scheduledCount: number;
}) {
  const firstPlan = args.plans[0];

  void captureNotificationScheduleHealth({
    cancelledCount: args.cancelledCount,
    currentDay: firstPlan?.data.dayNumber ?? null,
    moduleAvailable: args.moduleAvailable,
    permissionStatus: args.permissionStatus,
    plannedCount: args.plans.length,
    programSlug: firstPlan?.data.programSlug ?? null,
    programState: args.programState ?? null,
    scheduledCount: args.scheduledCount,
  });
}

export const NotificationService = {
  async addProgramNotificationResponseListener(
    onTarget: (target: ProgramNotificationTarget) => void,
    options?: NotificationServiceOptions
  ) {
    const notificationsModule = await getNotificationsModuleForService(options);
    if (!notificationsModule) {
      return null;
    }

    return notificationsModule.addNotificationResponseReceivedListener((response) => {
      const target = getProgramNotificationTargetFromResponse(response);
      if (target) {
        onTarget(target);
      }
    });
  },

  async getLastProgramNotificationResponseTarget(options?: NotificationServiceOptions) {
    const notificationsModule = await getNotificationsModuleForService(options);
    if (!notificationsModule || !('getLastNotificationResponseAsync' in notificationsModule)) {
      return null;
    }

    const response = await notificationsModule.getLastNotificationResponseAsync();
    return response ? getProgramNotificationTargetFromResponse(response) : null;
  },

  async cancelProgramNotifications(options?: NotificationServiceOptions) {
    const notificationsModule = await getNotificationsModuleForService(options);
    if (!notificationsModule) {
      return [];
    }

    const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
    const reminderIds = scheduled
      .filter(isRecoveryCompassProgramNotification)
      .map((notification) => notification.identifier);

    for (const id of reminderIds) {
      await notificationsModule.cancelScheduledNotificationAsync(id);
    }

    return reminderIds;
  },

  async scheduleProgramNotificationPlans(
    plans: NotificationPlan[],
    options?: NotificationServiceOptions
  ): Promise<ScheduleProgramNotificationsResult> {
    const notificationsModule = await getNotificationsModuleForService(options);
    if (!notificationsModule) {
      if (isNotificationQaLoggingEnabled()) {
        console.info('[NotificationQA]', {
          cancelledCount: 0,
          cancelledIds: [],
          moduleAvailable: false,
          permissionStatus: 'unavailable',
          plannedCount: plans.length,
          plannedIds: plans.map((plan) => plan.id),
          scheduledCount: 0,
          scheduledIds: [],
        });
      }

      reportNotificationScheduleHealth({
        cancelledCount: 0,
        moduleAvailable: false,
        permissionStatus: 'unavailable',
        plans,
        programState: options?.programState,
        scheduledCount: 0,
      });

      return {
        cancelledIds: [],
        scheduledIds: [],
      };
    }

    const now = options?.now ?? new Date();
    const shouldAbort = options?.shouldAbort;

    if (shouldAbort?.()) {
      return {
        cancelledIds: [],
        scheduledIds: [],
      };
    }

    await configureProgramNotificationChannel(notificationsModule);
    const permissionStatus = await getPermissionStatusForQaLog(notificationsModule);

    if (plans.length === 0) {
      const cancelledIds = await this.cancelProgramNotifications({ notificationsModule });

      if (isNotificationQaLoggingEnabled()) {
        console.info('[NotificationQA]', {
          cancelledCount: cancelledIds.length,
          cancelledIds,
          moduleAvailable: true,
          permissionStatus,
          plannedCount: 0,
          plannedIds: [],
          scheduledCount: 0,
          scheduledIds: [],
        });
      }

      reportNotificationScheduleHealth({
        cancelledCount: cancelledIds.length,
        moduleAvailable: true,
        permissionStatus,
        plans,
        programState: options?.programState,
        scheduledCount: 0,
      });

      return {
        cancelledIds,
        scheduledIds: [],
      };
    }

    if (!canScheduleLocalNotifications(permissionStatus)) {
      if (isNotificationQaLoggingEnabled()) {
        console.info('[NotificationQA]', {
          cancelledCount: 0,
          cancelledIds: [],
          moduleAvailable: true,
          permissionStatus,
          plannedCount: plans.length,
          plannedIds: plans.map((plan) => plan.id),
          scheduledCount: 0,
          scheduledIds: [],
          skippedReason: 'permission_not_granted',
        });
      }

      reportNotificationScheduleHealth({
        cancelledCount: 0,
        moduleAvailable: true,
        permissionStatus,
        plans,
        programState: options?.programState,
        scheduledCount: 0,
      });

      return {
        cancelledIds: [],
        scheduledIds: [],
      };
    }

    const existingIds = await getExistingProgramNotificationIds(notificationsModule);

    if (shouldAbort?.()) {
      return {
        cancelledIds: [],
        scheduledIds: [],
      };
    }

    const scheduledIds: string[] = [];

    for (const plan of plans) {
      if (shouldAbort?.()) {
        return {
          cancelledIds: [],
          scheduledIds,
        };
      }

      if (!shouldSchedulePlan(plan, now)) {
        continue;
      }

      const trigger = getPlanTrigger(plan, notificationsModule, now);
      if (trigger === null && plan.type !== 'day_completed') {
        continue;
      }

      try {
        const scheduledId = await notificationsModule.scheduleNotificationAsync({
          identifier: plan.id,
          content: {
            title: plan.title,
            body: plan.body,
            data: {
              source: PROGRAM_NOTIFICATION_SOURCE,
              planId: plan.id,
              ...plan.data,
            },
            sound: true,
            priority: notificationsModule.AndroidNotificationPriority.HIGH,
          },
          trigger,
        });

        scheduledIds.push(scheduledId);
      } catch (error) {
        console.warn('[NotificationService] Failed to schedule notification plan', {
          error,
          planId: plan.id,
        });
      }
    }

    if (shouldAbort?.()) {
      return {
        cancelledIds: [],
        scheduledIds,
      };
    }

    const scheduledIdSet = new Set(scheduledIds);
    const cancelledIds: string[] = [];

    for (const id of existingIds) {
      if (scheduledIdSet.has(id)) {
        continue;
      }

      await notificationsModule.cancelScheduledNotificationAsync(id);
      cancelledIds.push(id);
    }

    if (isNotificationQaLoggingEnabled()) {
      console.info('[NotificationQA]', {
        cancelledCount: cancelledIds.length,
        cancelledIds,
        moduleAvailable: true,
        permissionStatus,
        plannedCount: plans.length,
        plannedIds: plans.map((plan) => plan.id),
        scheduledCount: scheduledIds.length,
        scheduledIds,
      });
    }

    reportNotificationScheduleHealth({
      cancelledCount: cancelledIds.length,
      moduleAvailable: true,
      permissionStatus,
      plans,
      programState: options?.programState,
      scheduledCount: scheduledIds.length,
    });

    return {
      cancelledIds,
      scheduledIds,
    };
  },

  async initialize() {
    try {
      await this.cancelProgramNotifications();
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
    }
  },
};
