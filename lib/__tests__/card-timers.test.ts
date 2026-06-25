import { describe, expect, it } from 'vitest';

import {
  getBreathingCycleDuration,
  getBreathingPhaseState,
  getBreathingTotalDuration,
} from '@/lib/card-timers';

describe('breathing timer helpers', () => {
  it('calculates cycle and total duration with hold phases', () => {
    const pattern = { inhaleSeconds: 4, holdSeconds: 2, exhaleSeconds: 6 };

    expect(getBreathingCycleDuration(pattern)).toBe(12);
    expect(getBreathingTotalDuration(pattern, 5)).toBe(60);
  });

  it('calculates cycle duration without a hold phase', () => {
    const pattern = { inhaleSeconds: 4, exhaleSeconds: 6 };

    expect(getBreathingCycleDuration(pattern)).toBe(10);
    expect(getBreathingTotalDuration(pattern, 3)).toBe(30);
  });

  it('reports inhale, hold, and exhale states correctly', () => {
    const pattern = { inhaleSeconds: 4, holdSeconds: 2, exhaleSeconds: 6 };

    expect(getBreathingPhaseState(pattern, 3, 1.5)).toMatchObject({
      phase: 'inhale',
      cycleNumber: 1,
      phaseRemainingSeconds: 2.5,
    });

    expect(getBreathingPhaseState(pattern, 3, 4.5)).toMatchObject({
      phase: 'hold',
      cycleNumber: 1,
      phaseRemainingSeconds: 1.5,
    });

    expect(getBreathingPhaseState(pattern, 3, 8)).toMatchObject({
      phase: 'exhale',
      cycleNumber: 1,
      phaseRemainingSeconds: 4,
    });
  });

  it('tracks cycle numbers across repeated cycles', () => {
    const pattern = { inhaleSeconds: 4, exhaleSeconds: 6 };

    expect(getBreathingPhaseState(pattern, 10, 11)).toMatchObject({
      phase: 'inhale',
      cycleNumber: 2,
    });
  });

  it('clamps the state at the completed end of the final cycle', () => {
    const pattern = { inhaleSeconds: 4, holdSeconds: 1, exhaleSeconds: 5 };
    const state = getBreathingPhaseState(pattern, 2, 25);

    expect(state).toMatchObject({
      phase: 'exhale',
      cycleNumber: 2,
      elapsedSeconds: 20,
      totalSeconds: 20,
      phaseRemainingSeconds: 0,
    });
  });
});
