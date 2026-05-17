/**
 * lib/widget-bridge.ts
 *
 * Writes widget data to the iOS App Group shared container so the
 * home screen widget can read it without launching the app.
 *
 * Call `syncWidgetData()` whenever any of the underlying values change:
 *   - on app foreground
 *   - after completing/progressing a day
 *   - after step count updates
 *
 * Requires: react-native-shared-group-preferences
 *   Install: npx expo install react-native-shared-group-preferences
 *   Then rebuild native: npx expo run:ios
 */

import { NativeModules, Platform } from 'react-native';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import {
  getProgramActiveDay,
  getProgramLastFinalizedDay,
  getProgramNextUnlockAt,
  getProgramScheduledDay,
} from '@/lib/programs/schedule';
import type { ProgramAccessSnapshot, ProgramProgressRecord, ProgramSlug } from '@/lib/programs/types';

const APP_GROUP_ID = 'group.com.recoverycompass.shared';
const WIDGET_DATA_KEY = 'widget_data';
export const RECOVERY_COMPASS_WIDGET_KIND = 'RecoveryCompassWidget';

type NativeWidgetBridgeModule = {
  reloadTimelines?: (kind: string) => void;
  reloadAllTimelines?: () => void;
};

// The AsyncStorage key used in day-detail.tsx for card progress
export function getCardProgressStorageKey(programSlug: ProgramSlug, dayNumber: number) {
  return `progress:${programSlug}:${dayNumber}`;
}

export interface WidgetPayload {
  programSlug: string;
  programName: string;
  currentDay: number;
  totalDays: number;
  cardIndex: number;
  totalCards: number;
  streak: number;
  steps: number;
  isDayCompleted: boolean;
  isSessionLocked: boolean;
  availabilityLabel: string | null;
  updatedAt: string;
}

function formatWidgetAvailabilityLabel(nextUnlockAt: string | null | undefined, now: Date) {
  if (!nextUnlockAt) return null;

  const unlockDate = new Date(nextUnlockAt);
  if (Number.isNaN(unlockDate.getTime())) return null;

  const timeLabel = unlockDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    unlockDate.getFullYear() === tomorrow.getFullYear() &&
    unlockDate.getMonth() === tomorrow.getMonth() &&
    unlockDate.getDate() === tomorrow.getDate();

  return isTomorrow ? `Opens tomorrow ${timeLabel}` : `Opens at ${timeLabel}`;
}

/**
 * Write widget data to the shared App Group container.
 * Safe to call on Android (no-op) and when the library isn't installed.
 */
export async function syncWidgetData(payload: WidgetPayload): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    // Dynamically import so the app doesn't crash if the library isn't installed yet
    const SharedGroupPreferences = await import('react-native-shared-group-preferences')
      .then((m) => m.default ?? m)
      .catch(() => null);

    if (!SharedGroupPreferences) {
      console.warn('[WidgetBridge] react-native-shared-group-preferences not installed.');
      return;
    }

    await SharedGroupPreferences.setItem(
      WIDGET_DATA_KEY,
      JSON.stringify(payload),
      APP_GROUP_ID
    );

    // Prefer a targeted reload for this widget kind, with a fallback for
    // older or partial installs of the optional WidgetKit bridge.
    try {
      const nativeWidgetBridge = NativeModules.WidgetBridge as NativeWidgetBridgeModule | undefined;

      if (nativeWidgetBridge?.reloadTimelines) {
        nativeWidgetBridge.reloadTimelines(RECOVERY_COMPASS_WIDGET_KIND);
        return;
      }

      if (nativeWidgetBridge?.reloadAllTimelines) {
        nativeWidgetBridge.reloadAllTimelines();
        return;
      }

      // @ts-expect-error — react-native-widgetkit is an optional peer dep with no bundled types
      // eslint-disable-next-line import/no-unresolved
      const widgetKit = await import('react-native-widgetkit')
        .then((m: NativeWidgetBridgeModule) => m)
        .catch(() => ({ reloadTimelines: null, reloadAllTimelines: null }));

      if (widgetKit.reloadTimelines) {
        widgetKit.reloadTimelines(RECOVERY_COMPASS_WIDGET_KIND);
      } else {
        widgetKit.reloadAllTimelines?.();
      }
    } catch {
      // react-native-widgetkit is optional — widget will refresh on its own 30-min schedule
    }
  } catch (error) {
    console.warn('[WidgetBridge] Failed to sync widget data:', error);
  }
}

/**
 * Build a WidgetPayload from the data already available in the profile provider.
 * Pass cardIndex as the 0-based index of the card the user is currently on.
 */
export function buildWidgetPayload(args: {
  access: ProgramAccessSnapshot;
  progress: ProgramProgressRecord | null;
  cardIndex?: number;
  totalCards?: number;
  steps?: number;
  now?: Date;
}): WidgetPayload | null {
  const { access, progress, cardIndex = 0, totalCards = 1, steps = 0, now = new Date() } = args;

  if (!access.ownedProgram) return null;

  const meta = PROGRAM_METADATA[access.ownedProgram];
  const totalDays = meta.totalDays;
  const completedDays = progress?.completedDays ?? [];
  const partialDays = progress?.partialDays ?? [];
  const isProgramComplete = access.completionState === 'completed';
  const scheduledDay = access.startedAt
    ? getProgramScheduledDay(access.startedAt, totalDays, now)
    : access.currentDay ?? progress?.currentDay ?? 1;
  const activeDay = !isProgramComplete && access.startedAt
    ? getProgramActiveDay(access.startedAt, totalDays, now)
    : isProgramComplete
      ? null
      : scheduledDay;
  const lastFinalizedDay = access.startedAt
    ? getProgramLastFinalizedDay(access.startedAt, totalDays, now)
    : Math.max(0, ...completedDays, ...partialDays);
  const highestTouchedDay = Math.max(
    0,
    access.currentDay ?? 0,
    progress?.currentDay ?? 0,
    ...completedDays,
    ...partialDays
  );
  const unlockedThroughDay = isProgramComplete
    ? totalDays
    : Math.min(totalDays, Math.max(scheduledDay, highestTouchedDay || 1));
  const currentDay = isProgramComplete
    ? totalDays
    : activeDay ?? Math.min(totalDays, Math.max(unlockedThroughDay, lastFinalizedDay + 1, 1));
  const isSessionLocked = !isProgramComplete && activeDay == null;
  const availabilityLabel = isSessionLocked
    ? formatWidgetAvailabilityLabel(getProgramNextUnlockAt(access.startedAt, totalDays, now), now)
    : null;

  // Streak = number of consecutive completed days ending at currentDay - 1
  let streak = 0;
  for (let d = currentDay - 1; d >= 1; d--) {
    if (completedDays.includes(d)) {
      streak++;
    } else {
      break;
    }
  }

  const isDayCompleted = completedDays.includes(currentDay);

  return {
    programSlug: access.ownedProgram,
    programName: meta.name,
    currentDay,
    totalDays: meta.totalDays,
    cardIndex,
    totalCards,
    streak,
    steps,
    isDayCompleted,
    isSessionLocked,
    availabilityLabel,
    updatedAt: new Date().toISOString(),
  };
}
