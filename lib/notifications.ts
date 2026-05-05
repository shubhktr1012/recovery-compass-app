import { Platform } from 'react-native';
import * as Device from 'expo-device';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let hasConfiguredHandler = false;

function shouldSkipNotificationsModule(): boolean {
  // expo-notifications touches keychain-backed registration state at module load.
  // On iOS Simulator that can fail when the app is missing the entitlement path
  // used for persisted remote registration info. Remote push is device-only anyway.
  return Platform.OS === 'ios' && !Device.isDevice;
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

export const NotificationService = {
  async scheduleDaily9AMReminder() {
    const notificationsModule = await getNotificationsModule();
    if (!notificationsModule) {
      return;
    }

    const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
    const reminderIds = scheduled
      .filter((notification) => notification.content.title === 'Daily Progress Check-in')
      .map((notification) => notification.identifier);

    for (const id of reminderIds) {
      await notificationsModule.cancelScheduledNotificationAsync(id);
    }

    await notificationsModule.scheduleNotificationAsync({
      content: {
        title: 'Daily Progress Check-in',
        body: 'Time for your Recovery Compass session. Take a moment for yourself today.',
        sound: true,
        priority: notificationsModule.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: notificationsModule.SchedulableTriggerInputTypes.CALENDAR,
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  },

  async initialize() {
    try {
      await this.scheduleDaily9AMReminder();
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
    }
  },
};
