import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentNotificationPermissionStateAsync } from '@/lib/notification-permissions';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-device', () => ({
  isDevice: true,
}));

vi.mock('expo-constants', () => ({
  default: {
    easConfig: {
      projectId: 'test-project-id',
    },
  },
}));

const notificationMock = vi.hoisted(() => ({
  getExpoPushTokenAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
}));

vi.mock('expo-notifications', () => notificationMock);

describe('notification permission helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationMock.getPermissionsAsync.mockResolvedValue({
      canAskAgain: true,
      status: 'granted',
    });
  });

  it('treats granted local permission as usable even when push token lookup fails', async () => {
    notificationMock.getExpoPushTokenAsync.mockRejectedValue(new Error('push token unavailable'));

    await expect(getCurrentNotificationPermissionStateAsync()).resolves.toEqual({
      canAskAgain: true,
      expoPushToken: null,
      status: 'granted',
    });
  });
});
