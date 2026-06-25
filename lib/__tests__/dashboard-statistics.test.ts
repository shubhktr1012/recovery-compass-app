import { describe, expect, it } from 'vitest';

import { resolveDashboardStatItems } from '@/lib/dashboard-statistics';

describe('resolveDashboardStatItems', () => {
  it('uses rolling completion as a dashboard fallback metric when finalized truth exists', () => {
    const items = resolveDashboardStatItems({
      programSlug: 'energy_vitality',
      currentDayNumber: 3,
      dailySteps: null,
      totalDays: 14,
      completedDays: [1],
      partialDays: [2],
      currentStreak: 0,
      rollingCompletion: {
        daysCount: 2,
        cardsCompleted: 15,
        cardsTotal: 20,
        completionPercentage: 75,
      },
      hasAudio: false,
      onboardingResponse: null,
      questionnaireAnswers: null,
      isBaselineLoading: false,
    });

    expect(items.map((item) => item.id)).toEqual([
      'steps-today',
      'current-streak',
      'rolling-completion',
    ]);
    expect(items[2]).toMatchObject({
      label: '7-day score',
      value: '75%',
      sublabel: '15/20 cards completed',
    });
  });
});
