import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

import { PROGRAM_NOTIFICATION_CHANNEL_ID } from '@/lib/notifications';

type NotificationsModule = typeof import('expo-notifications');
type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface NotificationPermissionResult {
  canAskAgain?: boolean;
  expoPushToken: string | null;
  reason?: string;
  status: NotificationPermissionStatus;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'ios' && !Device.isDevice) {
    return null;
  }

  return import('expo-notifications');
}

async function configureAndroidChannel(notificationsModule: NotificationsModule) {
  if (Platform.OS !== 'android') return;

  await notificationsModule.setNotificationChannelAsync(PROGRAM_NOTIFICATION_CHANNEL_ID, {
    name: 'Program reminders',
    importance: notificationsModule.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#0A3B17',
  });
}

async function getExpoPushToken(notificationsModule: NotificationsModule) {
  if (!Device.isDevice) {
    return null;
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  try {
    const token = await notificationsModule.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    try {
      const token = await notificationsModule.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  }
}

export async function requestNotificationPermissionAsync(): Promise<NotificationPermissionResult> {
  const notificationsModule = await getNotificationsModule();

  if (!notificationsModule) {
    return {
      expoPushToken: null,
      reason: 'Notification permission is not available in this simulator.',
      status: 'unavailable',
    };
  }

  await configureAndroidChannel(notificationsModule);

  const existingPermission = await notificationsModule.getPermissionsAsync();
  let finalPermission = existingPermission;

  if (existingPermission.status !== 'granted' && existingPermission.canAskAgain) {
    finalPermission = await notificationsModule.requestPermissionsAsync();
  }

  if (finalPermission.status !== 'granted') {
    return {
      canAskAgain: finalPermission.canAskAgain,
      expoPushToken: null,
      status: finalPermission.status,
    };
  }

  return {
    canAskAgain: finalPermission.canAskAgain,
    expoPushToken: await getExpoPushToken(notificationsModule),
    status: 'granted',
  };
}
