import { describe, expect, it } from 'vitest';

import {
  isDeferredQueuedProgramRecord,
  shouldShowProgramQueueReview,
} from '@/lib/program-queue-review';
import type { OwnedProgramRecord } from '@/hooks/useOwnedPrograms';

function record(overrides: Partial<OwnedProgramRecord>): OwnedProgramRecord {
  return {
    completionState: 'not_started',
    currentDay: null,
    pausedAt: null,
    priorityRank: null,
    programState: 'purchased',
    purchaseState: 'owned_active',
    scheduledStartDate: null,
    slug: 'energy_vitality',
    startedAt: null,
    updatedAt: '2026-05-23T00:00:00.000Z',
    ...overrides,
  };
}

describe('program queue review helpers', () => {
  it('detects deferred queued programs when a previously started program was preserved', () => {
    expect(
      isDeferredQueuedProgramRecord(record({
        completionState: 'in_progress',
        currentDay: 1,
        programState: 'purchased',
      }))
    ).toBe(true);

    expect(
      isDeferredQueuedProgramRecord(record({
        completionState: 'not_started',
        currentDay: 1,
        programState: 'purchased',
      }))
    ).toBe(false);
  });

  it('shows review only for unacknowledged users with active and deferred programs', () => {
    const ownedPrograms = [
      record({
        completionState: 'in_progress',
        currentDay: 2,
        programState: 'active',
        slug: 'six_day_reset',
      }),
      record({
        completionState: 'in_progress',
        currentDay: 4,
        programState: 'purchased',
        slug: 'sleep_disorder_reset',
      }),
    ];

    expect(shouldShowProgramQueueReview({ ownedPrograms })).toBe(true);
    expect(
      shouldShowProgramQueueReview({
        ownedPrograms,
        queueReviewedAt: '2026-05-23T00:00:00.000Z',
      })
    ).toBe(false);
  });
});
