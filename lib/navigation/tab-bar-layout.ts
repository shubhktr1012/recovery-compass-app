import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** Matches `minHeight` on the floating tab bar group; used until layout measurement arrives. */
export const FLOATING_TAB_BAR_HEIGHT = 62;

/** Soft fade zone above the tab bar (visual only — not added to scroll padding). */
const FADE_EXTENSION = 36;

/** Breathing room between the last scroll item and the top of the tab bar. */
const CONTENT_CLEARANCE = 20;

export type TabBarScrollMetrics = {
  bottomOffset: number;
  barHeight: number;
  chromeHeight: number;
  overlayHeight: number;
  scrollPadding: number;
};

export function getFloatingTabBarBottomOffset(insets: Pick<EdgeInsets, 'bottom'>) {
  return Platform.OS === 'android'
    ? Math.max(insets.bottom + 8, 14)
    : Math.max(insets.bottom + 4, 12);
}

/** Extra clearance for Program timeline (long cards + fade zone). */
export const PROGRAM_TIMELINE_EXTRA_CLEARANCE = 40;

export function getProgramTabBarScrollPadding(
  insets: Pick<EdgeInsets, 'bottom'>,
  measuredBarHeight: number | null = null
) {
  return getTabBarScrollMetrics(insets, measuredBarHeight).scrollPadding + PROGRAM_TIMELINE_EXTRA_CLEARANCE;
}

export function getTabBarScrollMetrics(
  insets: Pick<EdgeInsets, 'bottom'>,
  measuredBarHeight: number | null = null
): TabBarScrollMetrics {
  const bottomOffset = getFloatingTabBarBottomOffset(insets);
  const barHeight = Math.max(measuredBarHeight ?? 0, FLOATING_TAB_BAR_HEIGHT);
  const chromeHeight = bottomOffset + barHeight;
  const overlayHeight = chromeHeight + FADE_EXTENSION;
  const scrollPadding = chromeHeight + CONTENT_CLEARANCE;

  return {
    bottomOffset,
    barHeight,
    chromeHeight,
    overlayHeight,
    scrollPadding,
  };
}
