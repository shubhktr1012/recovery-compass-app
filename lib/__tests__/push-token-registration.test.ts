import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerExpoPushTokenWithServer } from '@/lib/push-token-registration';

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-device', () => ({
  deviceName: 'Shubh iPhone',
  modelId: 'iPhone16,2',
  modelName: 'iPhone 15 Pro Max',
}));

vi.mock('expo-constants', () => ({
  default: {
    easConfig: { projectId: 'eas-project-id' },
    expoConfig: {
      extra: { eas: { projectId: 'expo-project-id' } },
      ios: { buildNumber: '31' },
      version: '1.1.4',
    },
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

describe('registerExpoPushTokenWithServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('does not call the server when no Expo token exists', async () => {
    await expect(registerExpoPushTokenWithServer(null)).resolves.toEqual({
      reason: 'missing_token',
      registered: false,
    });

    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('registers the Expo token with device metadata', async () => {
    await expect(
      registerExpoPushTokenWithServer({ data: 'ExpoPushToken[test-token]', type: 'expo' })
    ).resolves.toEqual({
      registered: true,
      token: { ok: true },
    });

    expect(invokeMock).toHaveBeenCalledWith('register-push-token', {
      body: {
        appBuildNumber: '31',
        appVersion: '1.1.4',
        deviceModel: 'iPhone 15 Pro Max',
        deviceName: 'Shubh iPhone',
        expoPushToken: 'ExpoPushToken[test-token]',
        platform: 'ios',
        projectId: 'expo-project-id',
      },
    });
  });

  it('surfaces registration errors to the caller', async () => {
    const error = new Error('edge function unavailable');
    invokeMock.mockResolvedValue({ data: null, error });

    await expect(registerExpoPushTokenWithServer('ExpoPushToken[test-token]')).rejects.toThrow(error);
  });
});
