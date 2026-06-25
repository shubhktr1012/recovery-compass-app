import type { Href } from 'expo-router';

import type { ProgramSlug } from '@/types/content';

type PersonalizationRouteParams = {
  mode?: 'realign';
  program?: ProgramSlug;
  resume?: 'review';
};

export const HOME_ROUTE = '/' as Href;
export const WELCOME_ROUTE = '/welcome' as Href;
export const SIGN_IN_ROUTE = '/sign-in' as Href;
export const SIGN_UP_ROUTE = '/sign-up' as Href;
export const RESET_PASSWORD_ROUTE = '/reset-password' as Href;
export const PAYWALL_ROUTE = '/paywall' as Href;
export const PERSONALIZATION_ROUTE = '/personalization' as Href;
export const PROGRAM_TAB_ROUTE = '/(tabs)/program' as Href;
export const JOURNAL_TAB_ROUTE = '/(tabs)/journal' as Href;
export const PROGRAM_START_ROUTE = '/program-start' as Href;
export const PROGRAM_QUEUE_REVIEW_ROUTE = '/program-queue-review' as Href;
export const NOTIFICATION_PERMISSION_REVIEW_ROUTE = '/notification-permission-review' as Href;
export const MY_PROGRAMS_ROUTE = '/account/programs' as Href;
export const ACCOUNT_SETTINGS_ROUTE = '/account/settings' as Href;
export const ACCOUNT_STATISTICS_ROUTE = '/account/statistics' as Href;
export const ACCOUNT_CITATIONS_ROUTE = '/account/citations' as Href;

function appendQuery(pathname: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    query.set(key, String(value));
  }

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function buildDayDetailRoute(params: {
  programSlug: ProgramSlug | string;
  dayNumber: number | string;
  mode?: 'review';
}) {
  return appendQuery('/day-detail', params) as Href;
}

export function buildProgramCompleteRoute(programSlug: ProgramSlug | string) {
  return appendQuery('/program-complete', { programSlug }) as Href;
}

export function buildProgramReviewRoute(programSlug: ProgramSlug | string) {
  return appendQuery('/(tabs)/program', { reviewProgram: programSlug }) as Href;
}

export function buildPersonalizationRoute(params: PersonalizationRouteParams = {}) {
  return appendQuery('/personalization', params) as Href;
}
