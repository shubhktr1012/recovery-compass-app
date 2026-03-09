import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import type {
  ExpoPushToken,
  Notification,
} from 'expo-notifications';

interface UsePushNotificationsOptions {
  enabled?: boolean;
}

type NotificationsModule = typeof import('expo-notifications');
type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';
type NotificationSubscription = { remove: () => void };

export interface PushNotificationState {
  expoPushToken?: ExpoPushToken;
  notification?: Notification;
  permissionStatus?: NotificationPermissionStatus;
  error?: Error;
}

interface RegisterResult {
  token?: ExpoPushToken;
  permissionStatus: NotificationPermissionStatus;
}

export const usePushNotifications = (
  options: UsePushNotificationsOptions = {}
): PushNotificationState => {
  const { enabled = true } = options;
  const [expoPushToken, setExpoPushToken] = useState<ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notification | undefined>();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const notificationsModuleRef = useRef<NotificationsModule | null>(null);
  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      setExpoPushToken(undefined);
      setPermissionStatus(undefined);
      setError(undefined);
      notificationsModuleRef.current = null;
      return;
    }

    // Android remote push support was removed from Expo Go (SDK 53+).
    if (isUnsupportedExpoGoAndroidRuntime()) {
      setPermissionStatus('undetermined');
      setExpoPushToken(undefined);
      setError(undefined);
      return;
    }

    let isMounted = true;
    setError(undefined);
    setExpoPushToken(undefined);

    getNotificationsModule()
      .then((notificationsModule) => {
        if (!isMounted || !notificationsModule) return;

        notificationsModuleRef.current = notificationsModule;

        return registerForPushNotificationsAsync(notificationsModule).then((result) => {
          if (!isMounted) return;

          setPermissionStatus(result.permissionStatus);
          setExpoPushToken(result.token);

          notificationListener.current =
            notificationsModule.addNotificationReceivedListener((receivedNotification) => {
              setNotification(receivedNotification);
            });

          responseListener.current =
            notificationsModule.addNotificationResponseReceivedListener((response) => {
              console.log('Notification response received:', response);
            });
        });
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Failed to register push notifications.'));
      });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const notificationsModule = notificationsModuleRef.current;
      if (!notificationsModule) return;

      notificationsModule.getPermissionsAsync()
        .then(({ status }) => setPermissionStatus(status))
        .catch(() => {
          // Ignore non-critical permission refresh errors.
        });
    });

    return () => {
      isMounted = false;
      notificationsModuleRef.current = null;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      appStateSub.remove();
    };
  }, [enabled]);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    error,
  };
};

function isUnsupportedExpoGoAndroidRuntime(): boolean {
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo';

  return Platform.OS === 'android' && isExpoGo;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isUnsupportedExpoGoAndroidRuntime()) {
    return null;
  }

  return import('expo-notifications');
}

async function registerForPushNotificationsAsync(
  notificationsModule: NotificationsModule
): Promise<RegisterResult> {
  let token: ExpoPushToken | undefined;

  if (Platform.OS === 'android') {
    await notificationsModule.setNotificationChannelAsync('default', {
      name: 'default',
      importance: notificationsModule.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await notificationsModule.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await notificationsModule.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { permissionStatus: finalStatus };
  }

  if (!Device.isDevice) {
    console.log('Push token registration requires a physical device.');
    return { permissionStatus: finalStatus };
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  // Always attempt with projectId first. Fall back to no-arg for dev setups.
  try {
    token = await notificationsModule.getExpoPushTokenAsync({ projectId });
  } catch {
    token = await notificationsModule.getExpoPushTokenAsync();
  }

  return {
    token,
    permissionStatus: finalStatus,
  };
}
