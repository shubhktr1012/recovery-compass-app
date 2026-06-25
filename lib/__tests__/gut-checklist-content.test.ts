import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Gut Reset Program checklist content', () => {
  it('uses real checklist items without done suffixes', () => {
    const filePath = path.join(process.cwd(), 'content/canonical/gut_health_reset.json');
    const program = JSON.parse(readFileSync(filePath, 'utf8')) as {
      days: {
        cards: {
          type?: string;
          variant?: string;
          title?: string;
          instructions?: string[];
          checklistItems?: string[];
          checklistQuote?: string;
        }[];
      }[];
    };

    const cards = program.days.flatMap((day) => day.cards);
    const checklistCards = cards.filter(
      (card) => card.type === 'action_step' && card.variant === 'checklist'
    );
    const checklistItems = checklistCards.flatMap((card) => card.checklistItems ?? []);

    expect(program.days).toHaveLength(21);
    expect(cards).toHaveLength(261);
    expect(checklistCards).toHaveLength(21);
    expect(checklistItems).toHaveLength(165);
    expect(checklistCards.every((card) => !card.instructions)).toBe(true);
    expect(checklistCards.every((card) => typeof card.checklistQuote === 'string')).toBe(true);
    expect(checklistItems.every((item) => !/:\s*done\b/i.test(item))).toBe(true);
  });
});
