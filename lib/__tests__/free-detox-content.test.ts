import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';
import {
  FREE_DETOX_TOTAL_DAYS,
  buildFreeDetoxProgressAfterDayState,
  canAccessFreeDetoxProgram,
  createEmptyFreeDetoxProgress,
  getFreeDetoxUnlockedThroughDay,
  getNextFreeDetoxDay,
} from '@/lib/free-program-progress';

vi.mock('@/lib/supabase', () => ({
  supabase: {},
}));

describe('free Detox content and progress', () => {
  it('has six clean app-native canonical days', () => {
    const filePath = path.join(process.cwd(), 'content/canonical/free_detox_reset.json');
    const raw = readFileSync(filePath, 'utf8');
    const program = JSON.parse(raw) as {
      days: {
        cards: {
          checklistItems?: string[];
          type?: string;
          variant?: string;
        }[];
      }[];
      slug: string;
      totalDays: number;
    };

    const serialized = JSON.stringify(program);
    const cards = program.days.flatMap((day) => day.cards);
    const checklistCards = cards.filter(
      (card) => card.type === 'action_step' && card.variant === 'checklist'
    );
    const checklistItems = checklistCards.flatMap((card) => card.checklistItems ?? []);

    expect(program.slug).toBe('free_detox_reset');
    expect(program.totalDays).toBe(FREE_DETOX_TOTAL_DAYS);
    expect(program.days).toHaveLength(FREE_DETOX_TOTAL_DAYS);
    expect(checklistCards).toHaveLength(FREE_DETOX_TOTAL_DAYS);
    expect(serialized).not.toContain('—');
    expect(serialized).not.toContain('$');
    expect(serialized).not.toMatch(/\bRECOVERY COMPASS\b/);
    expect(serialized).not.toMatch(/\bPage \d+\b/);
    expect(checklistItems.every((item) => !/:\s*done\b/i.test(item) && !/\bdone\b/i.test(item))).toBe(true);
  });

  it('unlocks Detox sequentially without paid program state', () => {
    const empty = createEmptyFreeDetoxProgress('user-1');
    expect(getNextFreeDetoxDay(empty)).toBe(1);
    expect(getFreeDetoxUnlockedThroughDay(empty)).toBe(1);

    const afterDayOne = buildFreeDetoxProgressAfterDayState({
      dayNumber: 1,
      progress: empty,
      requestedDayState: 'completed',
      userId: 'user-1',
    });

    expect(afterDayOne.currentDay).toBe(2);
    expect(afterDayOne.completedDays).toEqual([1]);
    const savedShape = {
      ...afterDayOne,
      updatedAt: '2026-06-08T00:00:00.000Z',
    };
    expect(getNextFreeDetoxDay(savedShape)).toBe(2);
    expect(getFreeDetoxUnlockedThroughDay(savedShape)).toBe(2);
  });

  it('allows free-tier or trusted paid users to open Detox', () => {
    const baseAccess = {
      ownedProgram: null,
      purchaseState: 'not_owned' as const,
      source: 'supabase' as const,
    };

    expect(
      canAccessFreeDetoxProgram({
        access: baseAccess,
        freeTierActivatedAt: null,
        userId: 'user-1',
      })
    ).toBe(false);

    expect(
      canAccessFreeDetoxProgram({
        access: baseAccess,
        freeTierActivatedAt: '2026-06-08T00:00:00.000Z',
        userId: 'user-1',
      })
    ).toBe(true);

    expect(
      canAccessFreeDetoxProgram({
        access: {
          ownedProgram: 'gut_health_reset',
          purchaseState: 'owned_active',
          source: 'supabase',
        },
        freeTierActivatedAt: null,
        userId: 'user-1',
      })
    ).toBe(true);
  });
});
