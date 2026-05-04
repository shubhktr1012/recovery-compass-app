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

import { Platform } from 'react-native';
import { PROGRAM_METADATA } from '@/content/programs/metadata';
import type { ProgramAccessSnapshot, ProgramProgressRecord, ProgramSlug } from '@/lib/programs/types';

const APP_GROUP_ID = 'group.com.recoverycompass.shared';
const WIDGET_DATA_KEY = 'widget_data';

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
  updatedAt: string;
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

    // Tell WidgetKit to reload all widget timelines so the display updates
    try {
      // @ts-expect-error — react-native-widgetkit is an optional peer dep with no bundled types
      const { reloadAllTimelines } = await import('react-native-widgetkit')
        .then((m: { reloadAllTimelines?: () => void }) => m)
        .catch(() => ({ reloadAllTimelines: null }));
      reloadAllTimelines?.();
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
}): WidgetPayload | null {
  const { access, progress, cardIndex = 0, totalCards = 1, steps = 0 } = args;

  if (!access.ownedProgram) return null;

  const meta = PROGRAM_METADATA[access.ownedProgram];
  const currentDay = access.currentDay ?? progress?.currentDay ?? 1;

  // Streak = number of consecutive completed days ending at currentDay - 1
  const completedDays = progress?.completedDays ?? [];
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
    updatedAt: new Date().toISOString(),
  };
}
