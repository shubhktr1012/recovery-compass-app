import { beforeEach, describe, expect, it, vi } from 'vitest';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getNotificationPermissionReviewKey,
  hasReviewedNotificationPermission,
  hasReviewedNotificationPermissionSync,
  markNotificationPermissionReviewCompleted,
  markNotificationPermissionReviewCompletedSync,
  resetNotificationPermissionReviewStateForTests,
  subscribeNotificationPermissionReviewStatus,
} from '@/lib/notification-permission-review';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('notification permission review state', () => {
  const userId = 'user-123';

  beforeEach(() => {
    resetNotificationPermissionReviewStateForTests();
    vi.mocked(AsyncStorage.getItem).mockReset();
    vi.mocked(AsyncStorage.setItem).mockReset();
  });

  it('syncs reviewed state across subscribers immediately', () => {
    const listener = vi.fn();

    subscribeNotificationPermissionReviewStatus(listener);
    markNotificationPermissionReviewCompletedSync(userId);

    expect(hasReviewedNotificationPermissionSync(userId)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('persists reviewed state to storage', async () => {
    await markNotificationPermissionReviewCompleted(userId);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      getNotificationPermissionReviewKey(userId),
      '1'
    );
    expect(hasReviewedNotificationPermissionSync(userId)).toBe(true);
  });

  it('reads reviewed state from storage into the sync cache', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue('1');

    await expect(hasReviewedNotificationPermission(userId)).resolves.toBe(true);
    expect(hasReviewedNotificationPermissionSync(userId)).toBe(true);
  });
});
