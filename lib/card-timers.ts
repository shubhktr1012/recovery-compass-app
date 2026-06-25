import type { BreathingExerciseCard } from '@/types/content';

type BreathingPattern = BreathingExerciseCard['pattern'];

export type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export type BreathingPhaseState = {
  phase: BreathingPhase;
  cycleNumber: number;
  totalSeconds: number;
  elapsedSeconds: number;
  phaseDurationSeconds: number;
  phaseElapsedSeconds: number;
  phaseRemainingSeconds: number;
};

export function getBreathingCycleDuration(pattern: BreathingPattern): number {
  return pattern.inhaleSeconds + (pattern.holdSeconds ?? 0) + pattern.exhaleSeconds;
}

export function getBreathingTotalDuration(
  pattern: BreathingPattern,
  cycles: number
): number {
  return Math.max(cycles, 0) * getBreathingCycleDuration(pattern);
}

export function getBreathingPhaseState(
  pattern: BreathingPattern,
  cycles: number,
  elapsedSeconds: number
): BreathingPhaseState {
  const safeCycles = Math.max(cycles, 1);
  const cycleDuration = getBreathingCycleDuration(pattern);
  const totalSeconds = getBreathingTotalDuration(pattern, safeCycles);

  if (cycleDuration <= 0 || totalSeconds <= 0) {
    return {
      phase: 'inhale',
      cycleNumber: 1,
      totalSeconds: 0,
      elapsedSeconds: 0,
      phaseDurationSeconds: 0,
      phaseElapsedSeconds: 0,
      phaseRemainingSeconds: 0,
    };
  }

  const clampedElapsed = Math.max(0, Math.min(elapsedSeconds, totalSeconds));

  if (clampedElapsed >= totalSeconds) {
    return {
      phase: 'exhale',
      cycleNumber: safeCycles,
      totalSeconds,
      elapsedSeconds: totalSeconds,
      phaseDurationSeconds: pattern.exhaleSeconds,
      phaseElapsedSeconds: pattern.exhaleSeconds,
      phaseRemainingSeconds: 0,
    };
  }

  const cycleIndex = Math.floor(clampedElapsed / cycleDuration);
  const cycleElapsed = clampedElapsed - cycleIndex * cycleDuration;
  const cycleNumber = Math.min(cycleIndex + 1, safeCycles);
  const inhaleEnd = pattern.inhaleSeconds;
  const holdDuration = pattern.holdSeconds ?? 0;
  const holdEnd = inhaleEnd + holdDuration;

  if (cycleElapsed < inhaleEnd) {
    return {
      phase: 'inhale',
      cycleNumber,
      totalSeconds,
      elapsedSeconds: clampedElapsed,
      phaseDurationSeconds: pattern.inhaleSeconds,
      phaseElapsedSeconds: cycleElapsed,
      phaseRemainingSeconds: pattern.inhaleSeconds - cycleElapsed,
    };
  }

  if (holdDuration > 0 && cycleElapsed < holdEnd) {
    const holdElapsed = cycleElapsed - inhaleEnd;

    return {
      phase: 'hold',
      cycleNumber,
      totalSeconds,
      elapsedSeconds: clampedElapsed,
      phaseDurationSeconds: holdDuration,
      phaseElapsedSeconds: holdElapsed,
      phaseRemainingSeconds: holdDuration - holdElapsed,
    };
  }

  const exhaleElapsed = cycleElapsed - holdEnd;

  return {
    phase: 'exhale',
    cycleNumber,
    totalSeconds,
    elapsedSeconds: clampedElapsed,
    phaseDurationSeconds: pattern.exhaleSeconds,
    phaseElapsedSeconds: exhaleElapsed,
    phaseRemainingSeconds: pattern.exhaleSeconds - exhaleElapsed,
  };
}
