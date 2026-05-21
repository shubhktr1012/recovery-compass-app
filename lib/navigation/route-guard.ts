import type { Href } from 'expo-router';

import {
  HOME_ROUTE,
  PAYWALL_ROUTE,
  PERSONALIZATION_ROUTE,
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

function isAllowedSubscribedRoute(segments: RouteSegments, modeParam?: string | null) {
  const inTabsGroup = segments[0] === '(tabs)';
  const inAccountStack = segments[0] === 'account';
  const inDayDetail = segments[0] === 'day-detail';
  const inProgramStartSetup = segments[0] === 'program-start';
  const inProgramComplete = segments[0] === 'program-complete';
  const inPaywall = isAuthScreen(segments, 'paywall');
  const inManualRealignment = isAuthScreen(segments, 'personalization') && modeParam === 'realign';

  return (
    inTabsGroup ||
    inAccountStack ||
    inDayDetail ||
    inProgramStartSetup ||
    inProgramComplete ||
    inPaywall ||
    inManualRealignment
  );
}

function isAllowedFreeTierRoute(segments: RouteSegments) {
  const inTabsGroup = segments[0] === '(tabs)';
  const inAccountStack = segments[0] === 'account';
  const inPaywall = isAuthScreen(segments, 'paywall');
  const inPersonalization = isAuthScreen(segments, 'personalization');

  return inTabsGroup || inAccountStack || inPaywall || inPersonalization;
}

export function getNavigationGuardTarget(state: NavigationGuardState): Href | null {
  const {
    freeTierActivatedAt,
    hasSession,
    isRecoveringPassword,
    isSubscribed,
    modeParam,
    needsOnboardingRealignment,
    needsProgramSetup,
    onboardingComplete,
    segments,
  } = state;

  const inAuthGroup = isInAuthGroup(segments);
  const inResetPassword = isAuthScreen(segments, 'reset-password');
  const inPersonalization = isAuthScreen(segments, 'personalization');

  if (isRecoveringPassword) {
    return inResetPassword ? null : RESET_PASSWORD_ROUTE;
  }

  if (!hasSession) {
    return inAuthGroup ? null : WELCOME_ROUTE;
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

    return isAllowedSubscribedRoute(segments, modeParam) ? null : HOME_ROUTE;
  }

  if (!onboardingComplete) {
    return inPersonalization ? null : PERSONALIZATION_ROUTE;
  }

  if (freeTierActivatedAt) {
    return isAllowedFreeTierRoute(segments) ? null : HOME_ROUTE;
  }

  return isAuthScreen(segments, 'paywall') ? null : PAYWALL_ROUTE;
}
