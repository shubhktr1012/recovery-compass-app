import { describe, expect, it, vi } from 'vitest';

import { buildUserDayStateRecord } from '@/lib/day-states';
import type { DayContent } from '@/types/content';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const baseDay = {
  programSlug: 'energy_vitality',
  dayNumber: 2,
  dayTitle: 'Energy Activation Upgrade',
  estimatedMinutes: 8,
  cards: [
    {
      type: 'intro',
      dayNumber: 2,
      dayTitle: 'Energy Activation Upgrade',
      goal: 'Begin the day with steady action.',
      timeSlot: 'morning',
      isTimeSensitive: false,
      hasEffortCheck: false,
    },
    {
      type: 'exercise_routine',
      name: 'Morning activation',
      category: 'Activation',
      steps: ['Stand tall', 'Breathe steadily'],
      sets: 2,
      reps: 3,
      timeSlot: 'morning',
      isTimeSensitive: false,
      hasEffortCheck: true,
    },
    {
      type: 'close',
      message: 'Complete today.',
      timeSlot: 'anytime',
      isTimeSensitive: false,
      hasEffortCheck: false,
    },
  ],
} as unknown as DayContent;

describe('buildUserDayStateRecord', () => {
  it('marks every card complete when a day is completed', () => {
    const record = buildUserDayStateRecord({
      userId: 'user-1',
      day: baseDay,
      requestedDayState: 'completed',
      currentIndex: 2,
      routineProgressByIndex: {
        1: {
          completedItems: ['Morning activation'],
          effortLevel: 'full',
        },
      },
      finalizedAt: '2026-05-17T10:00:00.000Z',
    });

    expect(record.day_state).toBe('completed');
    expect(record.cards_opened).toBe(3);
    expect(record.cards_completed).toBe(3);
    expect(record.cards_total).toBe(3);
    expect(record.completion_percentage).toBe(100);
    expect(record.card_details.every((detail) => detail.outcome === 'completed')).toBe(true);
  });

  it('does not allow a completed request to force 100 percent when a required routine is unfinished', () => {
    const record = buildUserDayStateRecord({
      userId: 'user-1',
      day: baseDay,
      requestedDayState: 'completed',
      currentIndex: 2,
      cardStates: ['available', 'available', 'available'],
      routineProgressByIndex: {
        1: { completedItems: [], effortLevel: null },
      },
      finalizedAt: '2026-05-17T10:00:00.000Z',
    });

    expect(record.day_state).toBe('partial');
    expect(record.cards_opened).toBe(3);
    expect(record.cards_completed).toBe(1);
    expect(record.completion_percentage).toBe(33.33);
    expect(record.card_details[1]?.outcome).toBe('skipped');
    expect(record.card_details[2]?.outcome).toBe('skipped');
  });

  it('records a partial day when a required routine was reached but not completed', () => {
    const record = buildUserDayStateRecord({
      userId: 'user-1',
      day: baseDay,
      requestedDayState: 'partial',
      currentIndex: 2,
      cardStates: ['available', 'available', 'available'],
      routineProgressByIndex: {
        1: { completedItems: [], effortLevel: null },
      },
      finalizedAt: '2026-05-17T10:00:00.000Z',
    });

    expect(record.day_state).toBe('partial');
    expect(record.cards_opened).toBe(3);
    expect(record.cards_completed).toBe(1);
    expect(record.cards_total).toBe(3);
    expect(record.completion_percentage).toBe(33.33);
    expect(record.card_details[0]?.outcome).toBe('completed');
    expect(record.card_details[1]?.outcome).toBe('skipped');
    expect(record.card_details[2]?.outcome).toBe('skipped');
  });

  it('keeps blocked card outcomes distinct in the finalized card details', () => {
    const record = buildUserDayStateRecord({
      userId: 'user-1',
      day: baseDay,
      requestedDayState: 'partial',
      currentIndex: 2,
      cardStates: ['available', 'blocked', 'available'],
      routineProgressByIndex: {
        1: {
          completedItems: ['Morning activation'],
          effortLevel: 'full',
        },
      },
      finalizedAt: '2026-05-17T10:00:00.000Z',
    });

    expect(record.day_state).toBe('partial');
    expect(record.cards_completed).toBe(1);
    expect(record.card_details[1]?.outcome).toBe('blocked');
  });
});
