import { describe, expect, it } from 'vitest';

import { getPostOnboardingRoute } from '@/lib/navigation/post-onboarding';
import { HOME_ROUTE, PAYWALL_ROUTE, PROGRAM_START_ROUTE } from '@/lib/navigation/routes';

describe('post onboarding route', () => {
  it('sends completed onboarding users without entitlement to paywall', () => {
    expect(
      getPostOnboardingRoute({
        access: {
          ownedProgram: null,
          programState: 'not_owned',
          purchaseState: 'not_owned',
        },
        freeTierActivatedAt: null,
      })
    ).toBe(PAYWALL_ROUTE);
  });

  it('sends manually granted purchased programs to setup', () => {
    expect(
      getPostOnboardingRoute({
        access: {
          ownedProgram: 'sleep_disorder_reset',
          programState: 'purchased',
          purchaseState: 'owned_active',
        },
        accessIsVerified: true,
        freeTierActivatedAt: null,
      })
    ).toBe(PROGRAM_START_ROUTE);
  });

  it('sends already active owned users home', () => {
    expect(
      getPostOnboardingRoute({
        access: {
          ownedProgram: 'sleep_disorder_reset',
          programState: 'active',
          purchaseState: 'owned_active',
        },
        accessIsVerified: true,
        freeTierActivatedAt: null,
      })
    ).toBe(HOME_ROUTE);
  });

  it('does not honor stale in-memory owned access unless it was verified first', () => {
    expect(
      getPostOnboardingRoute({
        access: {
          ownedProgram: 'sleep_disorder_reset',
          programState: 'purchased',
          purchaseState: 'owned_active',
        },
        accessIsVerified: false,
        freeTierActivatedAt: null,
      })
    ).toBe(PAYWALL_ROUTE);
  });

  it('sends free-tier users home instead of paywall', () => {
    expect(
      getPostOnboardingRoute({
        access: {
          ownedProgram: null,
          programState: 'not_owned',
          purchaseState: 'not_owned',
        },
        freeTierActivatedAt: '2026-05-21T00:00:00.000Z',
      })
    ).toBe(HOME_ROUTE);
  });
});
