import type { TextStyle } from 'react-native';

export const AppTypography = {
  body: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  bodyMuted: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  bodyCompact: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 21,
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    lineHeight: 26,
  } satisfies TextStyle,
  bodyLargeMedium: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 26,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  meta: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 18,
  } satisfies TextStyle,
  metaMedium: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 18,
  } satisfies TextStyle,
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  eyebrow: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 11,
    lineHeight: 14,
  } satisfies TextStyle,
  buttonSm: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  buttonMd: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  buttonLg: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  dataPoint: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 24,
  } satisfies TextStyle,
  displayQuote: {
    fontFamily: 'Erode-MediumItalic',
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  displayQuoteLarge: {
    fontFamily: 'Erode-Italic',
    fontSize: 16,
    lineHeight: 28,
  } satisfies TextStyle,
  displayCardSm: {
    fontFamily: 'Erode-Medium',
    fontSize: 17,
    lineHeight: 23,
  } satisfies TextStyle,
  displayCardSmItalic: {
    fontFamily: 'Erode-MediumItalic',
    fontSize: 17,
    lineHeight: 23,
  } satisfies TextStyle,
  displayCardSmTight: {
    fontFamily: 'Erode-Medium',
    fontSize: 17,
    lineHeight: 20,
  } satisfies TextStyle,
  displaySection: {
    fontFamily: 'Erode-Medium',
    fontSize: 18,
    lineHeight: 24,
  } satisfies TextStyle,
  displayCardMd: {
    fontFamily: 'Erode-Medium',
    fontSize: 20,
    lineHeight: 24,
  } satisfies TextStyle,
  displaySectionTitle: {
    fontFamily: 'Erode-Medium',
    fontSize: 21,
    lineHeight: 26,
  } satisfies TextStyle,
  displayMetric: {
    fontFamily: 'Erode-Medium',
    fontSize: 22,
    lineHeight: 22,
  } satisfies TextStyle,
  displayMetricItalic: {
    fontFamily: 'Erode-MediumItalic',
    fontSize: 22,
    lineHeight: 22,
  } satisfies TextStyle,
  displayMetricSemibold: {
    fontFamily: 'Erode-Semibold',
    fontSize: 22,
    lineHeight: 22,
  } satisfies TextStyle,
  displayPrompt: {
    fontFamily: 'Erode-Medium',
    fontSize: 23,
    lineHeight: 28,
  } satisfies TextStyle,
  displayAvatar: {
    fontFamily: 'Erode-Medium',
    fontSize: 26,
    lineHeight: 26,
  } satisfies TextStyle,
  displayHero: {
    fontFamily: 'Erode-Medium',
    fontSize: 32,
    lineHeight: 38,
  } satisfies TextStyle,
  displayHeroTight: {
    fontFamily: 'Erode-Medium',
    fontSize: 32,
    lineHeight: 34,
  } satisfies TextStyle,
  displayHeroLarge: {
    fontFamily: 'Erode-Medium',
    fontSize: 34,
    lineHeight: 37,
  } satisfies TextStyle,
  displayWelcome: {
    fontFamily: 'Erode-Medium',
    fontSize: 36,
    lineHeight: 40,
  } satisfies TextStyle,
  displayNumberXl: {
    fontFamily: 'Erode-Medium',
    fontSize: 48,
    lineHeight: 52,
  } satisfies TextStyle,
} as const;
