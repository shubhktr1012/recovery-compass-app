/**
 * Recovery Compass design tokens (v3-aligned).
 * Forest is accent; paper/canvas are default surfaces.
 */

import { Platform, type ViewStyle } from 'react-native';

export const AppColors = {
  paper: '#FAFAFA',
  canvas: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceRaised: '#FFFFFF',
  stone: '#F5F5F4',

  ink: '#1A2E1F',
  inkMuted: 'rgba(26, 46, 31, 0.68)',
  inkSubtle: 'rgba(26, 46, 31, 0.45)',

  forest: '#06290C',
  forestSoft: 'rgba(6, 41, 12, 0.12)',
  sage: '#E3F3E5',
  sageSoft: '#EEF6EF',

  hairline: 'rgba(26, 46, 31, 0.08)',

  // Legacy aliases — prefer ink* for new code
  mutedInk: 'rgba(26, 46, 31, 0.68)',
  subtleInk: 'rgba(26, 46, 31, 0.45)',

  success: '#056936',
  warning: '#B45309',
  danger: '#DC2626',
  live: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
  iconMuted: '#8E8E93',
  placeholderText: '#9CA3AF',
  parallaxIcon: '#808080',
  darkTeal: '#1D3D47',
  darkNeutralSurface: '#353636',
} as const;

export const AppRadii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const AppSpacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
} as const;

export const AppShadows = {
  neutral: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cta: {
    shadowColor: AppColors.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
} as const satisfies Record<string, ViewStyle>;

const tintColorLight = AppColors.forest;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: AppColors.ink,
    background: AppColors.paper,
    tint: tintColorLight,
    icon: AppColors.inkSubtle,
    tabIconDefault: AppColors.inkSubtle,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
