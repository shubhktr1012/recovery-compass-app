import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

import {
  getLocalDateKey,
  hasOpenedAppToday,
  isSameLocalCalendarDay,
  markAppOpenedToday,
} from '@/lib/notification-app-open';

describe('notification-app-open', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('tracks whether the app was opened on the same local calendar day', async () => {
    const now = new Date(2026, 4, 19, 15, 0);

    expect(await hasOpenedAppToday(now)).toBe(false);

    await markAppOpenedToday(now);

    expect(await hasOpenedAppToday(now)).toBe(true);
    expect(await hasOpenedAppToday(new Date(2026, 4, 20, 8, 0))).toBe(false);
  });

  it('compares local calendar days without time-of-day drift', () => {
    expect(
      isSameLocalCalendarDay(new Date(2026, 4, 19, 23, 59), new Date(2026, 4, 19, 0, 1))
    ).toBe(true);
    expect(getLocalDateKey(new Date(2026, 4, 19, 5, 30))).toBe('2026-05-19');
  });
});
