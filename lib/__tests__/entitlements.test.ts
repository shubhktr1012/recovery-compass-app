import { describe, expect, it } from 'vitest';

import {
  canAccessOwnedProgramRecord,
  canAccessProgramContent,
  canAccessProgramStartSetup,
  canReviewCompletedProgram,
  hasAnyProgramEntitlement,
  isTrustedAccessSource,
} from '@/lib/access/entitlements';

describe('premium entitlement decisions', () => {
  it('allows active access only when the owned program matches and is not not_owned', () => {
    expect(
      canAccessProgramContent(
        {
          ownedProgram: 'sleep_disorder_reset',
          purchaseState: 'owned_active',
          source: 'supabase',
        },
        'sleep_disorder_reset'
      )
    ).toEqual({ allowed: true, reason: 'active_access' });

    expect(
      canAccessProgramContent(
        {
          ownedProgram: 'sleep_disorder_reset',
          purchaseState: 'owned_active',
          source: 'supabase',
        },
        'energy_vitality'
      )
    ).toEqual({ allowed: false, reason: 'not_owned' });

    expect(
      canAccessProgramContent(
        {
          ownedProgram: 'sleep_disorder_reset',
          purchaseState: 'not_owned',
          source: 'supabase',
        },
        'sleep_disorder_reset'
      )
    ).toEqual({ allowed: false, reason: 'not_owned' });
  });

  it('treats Supabase manual grants as entitlement when program_access owns the program', () => {
    expect(
      hasAnyProgramEntitlement({
        ownedProgram: 'age_reversal',
        purchaseState: 'owned_active',
        source: 'supabase',
      })
    ).toBe(true);

    expect(
      canAccessProgramStartSetup({
        ownedProgram: 'age_reversal',
        purchaseState: 'owned_active',
        programState: 'purchased',
        source: 'supabase',
      })
    ).toBe(true);
  });

  it('does not treat local or RevenueCat-only snapshots as content entitlement', () => {
    expect(isTrustedAccessSource('supabase')).toBe(true);
    expect(isTrustedAccessSource('local')).toBe(false);
    expect(isTrustedAccessSource('revenuecat')).toBe(false);

    expect(
      hasAnyProgramEntitlement({
        ownedProgram: 'age_reversal',
        purchaseState: 'owned_active',
        source: 'revenuecat',
      })
    ).toBe(false);

    expect(
      canAccessProgramContent(
        {
          ownedProgram: 'age_reversal',
          purchaseState: 'owned_active',
          source: 'local',
        },
        'age_reversal'
      )
    ).toEqual({ allowed: false, reason: 'not_owned' });
  });

  it('does not allow program setup for already-started programs', () => {
    expect(
      canAccessProgramStartSetup({
        ownedProgram: 'age_reversal',
        purchaseState: 'owned_active',
        programState: 'active',
        source: 'supabase',
      })
    ).toBe(false);
  });

  it('allows completed journey review only for completed owned records', () => {
    expect(
      canReviewCompletedProgram(
        [
          {
            completionState: 'completed',
            programState: 'completed',
            purchaseState: 'owned_completed',
            slug: 'ninety_day_transform',
          },
        ],
        'ninety_day_transform'
      )
    ).toEqual({ allowed: true, reason: 'completed_review_access' });

    expect(
      canReviewCompletedProgram(
        [
          {
            completionState: 'in_progress',
            programState: 'active',
            purchaseState: 'owned_active',
            slug: 'ninety_day_transform',
          },
        ],
        'ninety_day_transform'
      )
    ).toEqual({ allowed: false, reason: 'not_owned' });
  });

  it('can check secondary owned program records for queued/manual-granted programs', () => {
    expect(
      canAccessOwnedProgramRecord(
        [
          {
            purchaseState: 'owned_active',
            slug: 'male_sexual_health',
          },
        ],
        'male_sexual_health'
      )
    ).toEqual({ allowed: true, reason: 'owned_program_access' });
  });
});
