import { Easing } from 'react-native-reanimated';

export const MotionDurations = {
  pressIn: 100,
  pressOut: 170,
  fast: 160,
  base: 220,
  screen: 300,
  slow: 420,
  stagger: 45,
} as const;

export const MotionScale = {
  press: 0.97,
  pressLarge: 0.985,
  dragLift: 1.015,
} as const;

export const MotionDistance = {
  entranceY: 10,
  screenY: 14,
  cardY: 8,
} as const;

export const MotionEasing = {
  standard: Easing.out(Easing.cubic),
  soft: Easing.out(Easing.quad),
  sharp: Easing.out(Easing.circle),
} as const;

export type MotionHaptic = 'none' | 'selection' | 'light' | 'medium' | 'success';
