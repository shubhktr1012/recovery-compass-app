import { describe, expect, it } from 'vitest';

import { getNavigationGuardTarget, type NavigationGuardState } from '@/lib/navigation/route-guard';
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

const baseState: NavigationGuardState = {
  freeTierActivatedAt: null,
  hasSession: true,
  isRecoveringPassword: false,
  isSubscribed: false,
  modeParam: null,
  needsOnboardingRealignment: false,
  needsNotificationPermissionReview: false,
  needsProgramQueueReview: false,
  needsProgramSetup: false,
  onboardingComplete: true,
  segments: ['(tabs)', 'index'],
};

function guardTarget(overrides: Partial<NavigationGuardState>) {
  return getNavigationGuardTarget({ ...baseState, ...overrides });
}

describe('navigation guard target', () => {
  it('sends logged-out users outside auth to welcome', () => {
    expect(guardTarget({ hasSession: false, segments: ['(tabs)', 'index'] })).toBe(WELCOME_ROUTE);
  });

  it('keeps logged-out users inside true pre-auth screens', () => {
    expect(guardTarget({ hasSession: false, segments: ['(auth)', 'sign-in'] })).toBeNull();
    expect(guardTarget({ hasSession: false, segments: ['(auth)', 'sign-up'] })).toBeNull();
    expect(guardTarget({ hasSession: false, segments: ['(auth)', 'welcome'] })).toBeNull();
    expect(guardTarget({ hasSession: false, segments: ['(auth)', 'onboarding'] })).toBeNull();
  });

  it('blocks logged-out users from paywall and personalization even though they live in auth group', () => {
    expect(guardTarget({ hasSession: false, segments: ['(auth)', 'paywall'] })).toBe(WELCOME_ROUTE);
    expect(guardTarget({ hasSession: false, segments: ['(auth)', 'personalization'] })).toBe(WELCOME_ROUTE);
  });

  it('sends password recovery sessions to reset password', () => {
    expect(guardTarget({ isRecoveringPassword: true, segments: ['(tabs)', 'index'] })).toBe(
      RESET_PASSWORD_ROUTE
    );
  });

  it('sends signed-in users with incomplete onboarding to personalization', () => {
    expect(guardTarget({ onboardingComplete: false, segments: ['(tabs)', 'index'] })).toBe(
      PERSONALIZATION_ROUTE
    );
  });

  it('sends subscribed users with purchased program setup pending to program start', () => {
    expect(
      guardTarget({
        isSubscribed: true,
        needsProgramSetup: true,
        segments: ['(tabs)', 'program'],
      })
    ).toBe(PROGRAM_START_ROUTE);
  });

  it('allows subscribed active users to stay in tabs, day detail, account, and completion routes', () => {
    expect(guardTarget({ isSubscribed: true, segments: ['(tabs)', 'program'] })).toBeNull();
    expect(guardTarget({ isSubscribed: true, segments: ['day-detail'] })).toBeNull();
    expect(guardTarget({ isSubscribed: true, segments: ['program', '[programSlug]', '[dayNumber]'] })).toBeNull();
    expect(guardTarget({ isSubscribed: true, segments: ['account', 'programs'] })).toBeNull();
    expect(guardTarget({ isSubscribed: true, segments: ['program-complete'] })).toBeNull();
  });

  it('sends subscribed legacy queue users to queue review once', () => {
    expect(
      guardTarget({
        isSubscribed: true,
        needsProgramQueueReview: true,
        segments: ['(tabs)', 'program'],
      })
    ).toBe(PROGRAM_QUEUE_REVIEW_ROUTE);

    expect(
      guardTarget({
        isSubscribed: true,
        needsProgramQueueReview: true,
        segments: ['program-queue-review'],
      })
    ).toBeNull();
  });

  it('sends subscribed users with pending notification review to the reminder prompt', () => {
    expect(
      guardTarget({
        isSubscribed: true,
        needsNotificationPermissionReview: true,
        segments: ['(tabs)', 'program'],
      })
    ).toBe(NOTIFICATION_PERMISSION_REVIEW_ROUTE);

    expect(
      guardTarget({
        isSubscribed: true,
        needsNotificationPermissionReview: true,
        segments: ['notification-permission-review'],
      })
    ).toBeNull();
  });

  it('prioritizes legacy queue review before notification review', () => {
    expect(
      guardTarget({
        isSubscribed: true,
        needsNotificationPermissionReview: true,
        needsProgramQueueReview: true,
        segments: ['(tabs)', 'program'],
      })
    ).toBe(PROGRAM_QUEUE_REVIEW_ROUTE);
  });

  it('sends subscribed users from stray routes back home', () => {
    expect(guardTarget({ isSubscribed: true, segments: ['oauthredirect'] })).toBe(HOME_ROUTE);
  });

  it('sends unsubscribed completed-onboarding users to paywall unless free tier is active', () => {
    expect(guardTarget({ segments: ['(tabs)', 'program'] })).toBe(PAYWALL_ROUTE);
    expect(
      guardTarget({
        freeTierActivatedAt: '2026-05-21T00:00:00.000Z',
        segments: ['(tabs)', 'program'],
      })
    ).toBeNull();
  });

  it('allows free-tier users to reach day detail for free journeys', () => {
    expect(
      guardTarget({
        freeTierActivatedAt: '2026-05-21T00:00:00.000Z',
        segments: ['day-detail'],
      })
    ).toBeNull();
  });

  it('allows onboarding-complete, signed-in, non-paid user with free_tier_activated_at to reopen into tabs and day detail without Paywall redirection', () => {
    // Reopen into tabs index
    expect(
      guardTarget({
        freeTierActivatedAt: '2026-05-21T00:00:00.000Z',
        hasSession: true,
        isSubscribed: false,
        onboardingComplete: true,
        segments: ['(tabs)', 'index'],
      })
    ).toBeNull();

    // Reopen into day detail
    expect(
      guardTarget({
        freeTierActivatedAt: '2026-05-21T00:00:00.000Z',
        hasSession: true,
        isSubscribed: false,
        onboardingComplete: true,
        segments: ['day-detail'],
      })
    ).toBeNull();
  });

  it('allows realignment personalization without redirecting away', () => {
    expect(
      guardTarget({
        isSubscribed: true,
        modeParam: 'realign',
        needsOnboardingRealignment: true,
        segments: ['(auth)', 'personalization'],
      })
    ).toBeNull();
  });

  it('sends users needing realignment to the realignment route', () => {
    expect(
      guardTarget({
        isSubscribed: true,
        needsOnboardingRealignment: true,
        segments: ['(tabs)', 'program'],
      })
    ).toBe(buildPersonalizationRoute({ mode: 'realign' }));
  });
});
