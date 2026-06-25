import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type { ExpoPushToken } from 'expo-notifications';

import { supabase } from '@/lib/supabase';

export type PushTokenRegistrationInput = string | ExpoPushToken | null | undefined;

function getTokenData(token: PushTokenRegistrationInput) {
  return typeof token === 'string' ? token : token?.data ?? null;
}

function getProjectId() {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    null
  );
}

function getAppBuildNumber() {
  if (Platform.OS === 'ios') {
    return Constants?.expoConfig?.ios?.buildNumber ?? null;
  }

  if (Platform.OS === 'android') {
    const versionCode = Constants?.expoConfig?.android?.versionCode;
    return typeof versionCode === 'number' ? String(versionCode) : null;
  }

  return null;
}

export async function registerExpoPushTokenWithServer(token: PushTokenRegistrationInput) {
  const expoPushToken = getTokenData(token);
  if (!expoPushToken) {
    return { registered: false as const, reason: 'missing_token' as const };
  }

  const { data, error } = await supabase.functions.invoke('register-push-token', {
    body: {
      appBuildNumber: getAppBuildNumber(),
      appVersion: Constants?.expoConfig?.version ?? null,
      deviceModel: Device.modelName ?? Device.modelId ?? null,
      deviceName: Device.deviceName ?? null,
      expoPushToken,
      platform: Platform.OS,
      projectId: getProjectId(),
    },
  });

  if (error) {
    throw error;
  }

  return {
    registered: true as const,
    token: data,
  };
}
