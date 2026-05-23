import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PERMISSION_REVIEW_KEY_PREFIX = 'rc_notification_permission_reviewed';

export function getNotificationPermissionReviewKey(userId: string) {
  return `${NOTIFICATION_PERMISSION_REVIEW_KEY_PREFIX}:${userId}`;
}

export async function hasReviewedNotificationPermission(userId: string) {
  const value = await AsyncStorage.getItem(getNotificationPermissionReviewKey(userId));
  return value === '1';
}

export async function markNotificationPermissionReviewCompleted(userId: string) {
  await AsyncStorage.setItem(getNotificationPermissionReviewKey(userId), '1');
}
