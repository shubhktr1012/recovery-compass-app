import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

interface UsePushNotificationsOptions {
  enabled?: boolean;
}

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
  permissionStatus?: Notifications.PermissionStatus;
  error?: Error;
}

interface RegisterResult {
  token?: Notifications.ExpoPushToken;
  permissionStatus: Notifications.PermissionStatus;
}

export const usePushNotifications = (
  options: UsePushNotificationsOptions = {}
): PushNotificationState => {
  const { enabled = true } = options;
  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();
  const [permissionStatus, setPermissionStatus] = useState<
    Notifications.PermissionStatus | undefined
  >();
  const [error, setError] = useState<Error | undefined>();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      setExpoPushToken(undefined);
      setPermissionStatus(undefined);
      setError(undefined);
      return;
    }

    let isMounted = true;
    setError(undefined);
    setExpoPushToken(undefined);

    registerForPushNotificationsAsync().then(
      (result) => {
        if (!isMounted) return;
        setPermissionStatus(result.permissionStatus);
        setExpoPushToken(result.token);
      },
      (err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Failed to register push notifications.'));
      }
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response received:', response);
      });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      Notifications.getPermissionsAsync()
        .then(({ status }) => setPermissionStatus(status))
        .catch(() => {
          // Ignore non-critical permission refresh errors.
        });
    });

    return () => {
      isMounted = false;
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

async function registerForPushNotificationsAsync(): Promise<RegisterResult> {
  let token: Notifications.ExpoPushToken | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
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
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  // Always attempt with projectId first. Fall back to no-arg for dev setups.
  try {
    token = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch {
    token = await Notifications.getExpoPushTokenAsync();
  }

  return {
    token,
    permissionStatus: finalStatus,
  };
}
