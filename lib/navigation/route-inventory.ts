export const APP_ROUTE_PATHS = [
  '/',
  '/account/citations',
  '/account/programs',
  '/account/settings',
  '/account/statistics',
  '/day-detail',
  '/journal',
  '/notification-permission-review',
  '/oauthredirect',
  '/paywall',
  '/personalization',
  '/profile',
  '/program',
  '/program-complete',
  '/program-queue-review',
  '/program-start',
  '/reset-password',
  '/sign-in',
  '/sign-up',
  '/welcome',
  '/(tabs)/journal',
  '/(tabs)/profile',
  '/(tabs)/program',
] as const;

export const LEGACY_ROUTE_PATTERNS = [
  /^\/program\/[^/]+\/[^/]+$/,
] as const;

const APP_ROUTE_PATH_SET = new Set<string>(APP_ROUTE_PATHS);

export function stripRouteQuery(route: string) {
  return route.split('?')[0]?.split('#')[0] ?? route;
}

export function isKnownInternalRoute(route: string) {
  const path = stripRouteQuery(route);
  return APP_ROUTE_PATH_SET.has(path) || LEGACY_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

export function isExternalRoute(route: string) {
  return /^(https?:|mailto:|tel:)/i.test(route);
}
