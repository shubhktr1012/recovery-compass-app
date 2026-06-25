import type { Href } from 'expo-router';

import {
  HOME_ROUTE,
  NOTIFICATION_PERMISSION_REVIEW_ROUTE,
  PAYWALL_ROUTE,
  PERSONALIZATION_ROUTE,
  PROGRAM_QUEUE_REVIEW_ROUTE,
  PROGRAM_START_ROUTE,
  RESET_PASSWORD_ROUTE,
  WELCOME_ROUTE,
  buildPersonalizationRoute,
} from '@/lib/navigation/routes';

type RouteSegments = readonly string[];

export type NavigationGuardState = {
  freeTierActivatedAt?: string | null;
  hasSession: boolean;
  isRecoveringPassword: boolean;
  isSubscribed: boolean;
  modeParam?: string | null;
  needsOnboardingRealignment: boolean;
  needsNotificationPermissionReview: boolean;
  needsProgramQueueReview: boolean;
  needsProgramSetup: boolean;
  onboardingComplete?: boolean | null;
  segments: RouteSegments;
};

function isInAuthGroup(segments: RouteSegments) {
  return segments[0] === '(auth)';
}

function isAuthScreen(segments: RouteSegments, screen: string) {
  return isInAuthGroup(segments) && segments[1] === screen;
}

function isAllowedLoggedOutRoute(segments: RouteSegments) {
  if (!isInAuthGroup(segments)) {
    return false;
  }

  return (
    segments[1] === 'welcome' ||
    segments[1] === 'onboarding' ||
    segments[1] === 'sign-in' ||
    segments[1] === 'sign-up' ||
    segments[1] === 'reset-password'
  );
}

function isAllowedSubscribedRoute(segments: RouteSegments, modeParam?: string | null) {
  const inTabsGroup = segments[0] === '(tabs)';
  const inAccountStack = segments[0] === 'account';
  const inDayDetail = segments[0] === 'day-detail';
  const inLegacyProgramDayRoute = segments[0] === 'program';
  const inProgramStartSetup = segments[0] === 'program-start';
  const inProgramQueueReview = segments[0] === 'program-queue-review';
  const inNotificationPermissionReview = segments[0] === 'notification-permission-review';
  const inProgramComplete = segments[0] === 'program-complete';
  const inPaywall = isAuthScreen(segments, 'paywall');
  const inManualRealignment = isAuthScreen(segments, 'personalization') && modeParam === 'realign';

  return (
    inTabsGroup ||
    inAccountStack ||
    inDayDetail ||
    inLegacyProgramDayRoute ||
    inProgramStartSetup ||
    inProgramQueueReview ||
    inNotificationPermissionReview ||
    inProgramComplete ||
    inPaywall ||
    inManualRealignment
  );
}

function isAllowedFreeTierRoute(segments: RouteSegments) {
  const inTabsGroup = segments[0] === '(tabs)';
  const inAccountStack = segments[0] === 'account';
  const inDayDetail = segments[0] === 'day-detail';
  const inNotificationPermissionReview = segments[0] === 'notification-permission-review';
  const inPaywall = isAuthScreen(segments, 'paywall');
  const inPersonalization = isAuthScreen(segments, 'personalization');

  return inTabsGroup || inAccountStack || inDayDetail || inNotificationPermissionReview || inPaywall || inPersonalization;
}

export function getNavigationGuardTarget(state: NavigationGuardState): Href | null {
  const {
    freeTierActivatedAt,
    hasSession,
    isRecoveringPassword,
    isSubscribed,
    modeParam,
    needsOnboardingRealignment,
    needsNotificationPermissionReview,
    needsProgramQueueReview,
    needsProgramSetup,
    onboardingComplete,
    segments,
  } = state;

  const inResetPassword = isAuthScreen(segments, 'reset-password');
  const inPersonalization = isAuthScreen(segments, 'personalization');

  if (isRecoveringPassword) {
    return inResetPassword ? null : RESET_PASSWORD_ROUTE;
  }

  if (!hasSession) {
    return isAllowedLoggedOutRoute(segments) ? null : WELCOME_ROUTE;
  }

  if (isSubscribed) {
    if (!onboardingComplete) {
      return inPersonalization ? null : PERSONALIZATION_ROUTE;
    }

    if (needsProgramSetup) {
      return segments[0] === 'program-start' ? null : PROGRAM_START_ROUTE;
    }

    if (needsOnboardingRealignment) {
      return inPersonalization ? null : buildPersonalizationRoute({ mode: 'realign' });
    }

    if (needsProgramQueueReview) {
      return segments[0] === 'program-queue-review' ? null : PROGRAM_QUEUE_REVIEW_ROUTE;
    }

    if (needsNotificationPermissionReview) {
      return segments[0] === 'notification-permission-review' ? null : NOTIFICATION_PERMISSION_REVIEW_ROUTE;
    }

    return isAllowedSubscribedRoute(segments, modeParam) ? null : HOME_ROUTE;
  }

  if (!onboardingComplete) {
    return inPersonalization ? null : PERSONALIZATION_ROUTE;
  }

  if (freeTierActivatedAt) {
    if (needsNotificationPermissionReview) {
      return segments[0] === 'notification-permission-review' ? null : NOTIFICATION_PERMISSION_REVIEW_ROUTE;
    }

    return isAllowedFreeTierRoute(segments) ? null : HOME_ROUTE;
  }

  return isAuthScreen(segments, 'paywall') ? null : PAYWALL_ROUTE;
}
