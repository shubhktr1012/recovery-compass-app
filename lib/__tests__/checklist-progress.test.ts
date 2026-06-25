import { describe, expect, it } from 'vitest';

import {
  EMPTY_CHECKLIST_PROGRESS,
  parseChecklistProgress,
  serializeChecklistProgress,
} from '@/lib/checklist-progress';

describe('checklist progress helpers', () => {
  it('parses legacy array storage', () => {
    expect(parseChecklistProgress('["a","b"]')).toEqual({
      checkedItems: ['a', 'b'],
    });
  });

  it('parses structured checklist progress', () => {
    expect(parseChecklistProgress('{"checkedItems":["a"]}')).toEqual({
      checkedItems: ['a'],
    });
  });

  it('falls back safely on invalid data', () => {
    expect(parseChecklistProgress('{"checkedItems":"bad"}')).toEqual(EMPTY_CHECKLIST_PROGRESS);
    expect(parseChecklistProgress('not-json')).toEqual(EMPTY_CHECKLIST_PROGRESS);
  });

  it('serializes the structured record format', () => {
    expect(
      serializeChecklistProgress({
        checkedItems: ['item-1'],
      })
    ).toBe('{"checkedItems":["item-1"]}');
  });
});
