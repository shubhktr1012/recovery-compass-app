import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const DEV_CLOCK_OVERRIDE_KEY = 'dev:minute-clock-override';
const devClockListeners = new Set<() => void>();

function notifyDevClockListeners() {
  for (const listener of devClockListeners) {
    listener();
  }
}

function parseClockOverride(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDevClockOverrideKey() {
  return DEV_CLOCK_OVERRIDE_KEY;
}

export async function readDevClockOverride() {
  if (!__DEV__) return null;
  const rawValue = await AsyncStorage.getItem(DEV_CLOCK_OVERRIDE_KEY);
  return parseClockOverride(rawValue);
}

export async function setDevClockOverride(value: string | Date) {
  if (!__DEV__) return;
  const nextValue = value instanceof Date ? value.toISOString() : value;
  await AsyncStorage.setItem(DEV_CLOCK_OVERRIDE_KEY, nextValue);
  notifyDevClockListeners();
}

export async function clearDevClockOverride() {
  if (!__DEV__) return;
  await AsyncStorage.removeItem(DEV_CLOCK_OVERRIDE_KEY);
  notifyDevClockListeners();
}

export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  const [overrideNow, setOverrideNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    let isCancelled = false;

    const syncOverride = async () => {
      try {
        const nextOverride = await readDevClockOverride();
        if (!isCancelled) {
          setOverrideNow(nextOverride);
        }
      } catch (error) {
        console.error('Failed to read dev clock override', error);
      }
    };

    const handleOverrideChange = () => {
      void syncOverride();
    };

    devClockListeners.add(handleOverrideChange);
    void syncOverride();

    return () => {
      isCancelled = true;
      devClockListeners.delete(handleOverrideChange);
    };
  }, []);

  useEffect(() => {
    if (overrideNow) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [overrideNow]);

  return overrideNow ?? now;
}
