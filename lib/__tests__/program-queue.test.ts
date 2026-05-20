import { describe, expect, it } from 'vitest';

import {
  getQueueDropIndexFromAbsoluteY,
  getQueueDropIndexFromDragDelta,
  getQueueTouchOffset,
  reorderProgramQueue,
  type QueueItemLayout,
} from '@/lib/program-queue';
import type { ProgramSlug } from '@/types/content';

const queue = [
  'energy_vitality',
  'age_reversal',
  'male_sexual_health',
  'sleep_disorder_reset',
] as ProgramSlug[];

const layouts: Record<string, QueueItemLayout> = {
  energy_vitality: { y: 0, height: 160 },
  age_reversal: { y: 172, height: 220 },
  male_sexual_health: { y: 404, height: 180 },
  sleep_disorder_reset: { y: 596, height: 160 },
};

describe('program queue reorder helpers', () => {
  it('uses measured card heights when calculating a drag-distance drop', () => {
    expect(
      getQueueDropIndexFromDragDelta({
        dragDeltaY: 198,
        fromIndex: 0,
        itemLayouts: layouts,
        orderedSlugs: queue,
      })
    ).toBe(0);

    expect(
      getQueueDropIndexFromDragDelta({
        dragDeltaY: 205,
        fromIndex: 0,
        itemLayouts: layouts,
        orderedSlugs: queue,
      })
    ).toBe(1);

    expect(
      getQueueDropIndexFromDragDelta({
        dragDeltaY: 460,
        fromIndex: 0,
        itemLayouts: layouts,
        orderedSlugs: queue,
      })
    ).toBe(2);
  });

  it('uses actual finger position and touch offset for drop targeting', () => {
    const touchOffset = getQueueTouchOffset({
      absoluteY: 120,
      containerPageY: 40,
      itemLayout: layouts.energy_vitality,
    });

    expect(touchOffset).toBe(80);
    expect(
      getQueueDropIndexFromAbsoluteY({
        absoluteY: 660,
        containerPageY: 40,
        fromIndex: 0,
        itemLayouts: layouts,
        orderedSlugs: queue,
        touchOffsetWithinItem: touchOffset,
      })
    ).toBe(2);
  });

  it('calculates upward drops against the other cards, not the original index', () => {
    expect(
      getQueueDropIndexFromAbsoluteY({
        absoluteY: 250,
        containerPageY: 40,
        fromIndex: 2,
        itemLayouts: layouts,
        orderedSlugs: queue,
        touchOffsetWithinItem: 90,
      })
    ).toBe(1);
  });

  it('reorders immutably and no-ops invalid moves', () => {
    expect(reorderProgramQueue(queue, 0, 2)).toEqual([
      'age_reversal',
      'male_sexual_health',
      'energy_vitality',
      'sleep_disorder_reset',
    ]);
    expect(reorderProgramQueue(queue, 2, 2)).toBe(queue);
    expect(reorderProgramQueue(queue, -1, 2)).toBe(queue);
  });
});
