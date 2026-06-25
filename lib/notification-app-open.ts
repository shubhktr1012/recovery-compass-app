import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_APP_OPEN_DATE_KEY = 'rc:last_app_open_local_date';

export function getLocalDateKey(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function markAppOpenedToday(now: Date = new Date()) {
  await AsyncStorage.setItem(LAST_APP_OPEN_DATE_KEY, getLocalDateKey(now));
}

export async function hasOpenedAppToday(now: Date = new Date()) {
  const stored = await AsyncStorage.getItem(LAST_APP_OPEN_DATE_KEY);
  return stored === getLocalDateKey(now);
}

export function isSameLocalCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
