import { describe, expect, it } from 'vitest';

import {
  EMPTY_ROUTINE_PROGRESS,
  parseRoutineProgress,
  serializeRoutineProgress,
} from '@/lib/routine-progress';

describe('routine progress helpers', () => {
  it('parses legacy array storage', () => {
    expect(parseRoutineProgress('["a","b"]')).toEqual({
      completedItems: ['a', 'b'],
      effortLevel: null,
    });
  });

  it('parses structured progress with effort level', () => {
    expect(parseRoutineProgress('{"completedItems":["a"],"effortLevel":"shorter"}')).toEqual({
      completedItems: ['a'],
      effortLevel: 'shorter',
    });
  });

  it('falls back safely on invalid data', () => {
    expect(parseRoutineProgress('{"completedItems":"bad"}')).toEqual(EMPTY_ROUTINE_PROGRESS);
    expect(parseRoutineProgress('not-json')).toEqual(EMPTY_ROUTINE_PROGRESS);
  });

  it('serializes the structured record format', () => {
    expect(
      serializeRoutineProgress({
        completedItems: ['item-1'],
        effortLevel: 'full',
      })
    ).toBe('{"completedItems":["item-1"],"effortLevel":"full"}');
  });
});
