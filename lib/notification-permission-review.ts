import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PERMISSION_REVIEW_KEY_PREFIX = 'rc_notification_permission_reviewed';

const reviewedUserIds = new Set<string>();
const reviewStatusListeners = new Set<() => void>();

function notifyReviewStatusListeners() {
  reviewStatusListeners.forEach((listener) => {
    listener();
  });
}

export function getNotificationPermissionReviewKey(userId: string) {
  return `${NOTIFICATION_PERMISSION_REVIEW_KEY_PREFIX}:${userId}`;
}

export function hasReviewedNotificationPermissionSync(userId: string) {
  return reviewedUserIds.has(userId);
}

export function subscribeNotificationPermissionReviewStatus(listener: () => void) {
  reviewStatusListeners.add(listener);
  return () => {
    reviewStatusListeners.delete(listener);
  };
}

export async function hasReviewedNotificationPermission(userId: string) {
  if (hasReviewedNotificationPermissionSync(userId)) {
    return true;
  }

  const value = await AsyncStorage.getItem(getNotificationPermissionReviewKey(userId));
  const reviewed = value === '1';

  if (reviewed) {
    reviewedUserIds.add(userId);
  }

  return reviewed;
}

export function markNotificationPermissionReviewCompletedSync(userId: string) {
  reviewedUserIds.add(userId);
  notifyReviewStatusListeners();
}

export async function markNotificationPermissionReviewCompleted(userId: string) {
  markNotificationPermissionReviewCompletedSync(userId);
  await AsyncStorage.setItem(getNotificationPermissionReviewKey(userId), '1');
}

/** @internal Test helper */
export function resetNotificationPermissionReviewStateForTests() {
  reviewedUserIds.clear();
  reviewStatusListeners.clear();
}
