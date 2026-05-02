import type { TextStyle } from 'react-native';

export const AppTypography = {
  body: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 22,
  } satisfies TextStyle,
  bodyMuted: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 22,
  } satisfies TextStyle,
  bodyCompact: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 20,
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  bodyLargeMedium: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  meta: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    lineHeight: 16,
  } satisfies TextStyle,
} as const;
