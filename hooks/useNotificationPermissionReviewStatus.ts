import { useCallback, useEffect, useState } from 'react';

import {
  hasReviewedNotificationPermission,
  hasReviewedNotificationPermissionSync,
  markNotificationPermissionReviewCompleted,
  subscribeNotificationPermissionReviewStatus,
} from '@/lib/notification-permission-review';

type UseNotificationPermissionReviewStatusArgs = {
  enabled?: boolean;
  notificationsEnabled: boolean;
  userId?: string | null;
};

export function useNotificationPermissionReviewStatus({
  enabled = true,
  notificationsEnabled,
  userId,
}: UseNotificationPermissionReviewStatusArgs) {
  const [hasReviewed, setHasReviewed] = useState(
    () => (userId ? hasReviewedNotificationPermissionSync(userId) : false)
  );
  const [hasResolvedStoredReview, setHasResolvedStoredReview] = useState(
    () => (userId ? hasReviewedNotificationPermissionSync(userId) : false)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeNotificationPermissionReviewStatus(() => {
      if (hasReviewedNotificationPermissionSync(userId)) {
        setHasReviewed(true);
        setHasResolvedStoredReview(true);
        setIsLoading(false);
      }
    });
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    if (!enabled || !userId || notificationsEnabled) {
      setHasReviewed(false);
      setHasResolvedStoredReview(true);
      setIsLoading(false);
      return;
    }

    if (hasReviewedNotificationPermissionSync(userId)) {
      setHasReviewed(true);
      setHasResolvedStoredReview(true);
      setIsLoading(false);
      return;
    }

    setHasResolvedStoredReview(false);
    setIsLoading(true);
    void hasReviewedNotificationPermission(userId)
      .then((reviewed) => {
        if (isMounted) {
          setHasReviewed(reviewed);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Fail open. A storage read problem should never trap users behind a prompt.
          setHasReviewed(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasResolvedStoredReview(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [enabled, notificationsEnabled, userId]);

  const markReviewed = useCallback(async () => {
    if (!userId) return;
    await markNotificationPermissionReviewCompleted(userId);
    setHasReviewed(true);
    setHasResolvedStoredReview(true);
  }, [userId]);

  return {
    hasReviewed,
    isLoading,
    markReviewed,
    shouldReviewNotifications: Boolean(
      enabled &&
      userId &&
      !notificationsEnabled &&
      hasResolvedStoredReview &&
      !hasReviewed
    ),
  };
}
