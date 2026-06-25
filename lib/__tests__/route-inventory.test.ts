import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  APP_ROUTE_PATHS,
  isExternalRoute,
  isKnownInternalRoute,
  stripRouteQuery,
} from '@/lib/navigation/route-inventory';
import {
  ACCOUNT_CITATIONS_ROUTE,
  ACCOUNT_SETTINGS_ROUTE,
  ACCOUNT_STATISTICS_ROUTE,
  HOME_ROUTE,
  JOURNAL_TAB_ROUTE,
  MY_PROGRAMS_ROUTE,
  NOTIFICATION_PERMISSION_REVIEW_ROUTE,
  PAYWALL_ROUTE,
  PERSONALIZATION_ROUTE,
  PROGRAM_QUEUE_REVIEW_ROUTE,
  PROGRAM_START_ROUTE,
  PROGRAM_TAB_ROUTE,
  RESET_PASSWORD_ROUTE,
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
  WELCOME_ROUTE,
  buildDayDetailRoute,
  buildPersonalizationRoute,
  buildProgramCompleteRoute,
  buildProgramReviewRoute,
} from '@/lib/navigation/routes';

const PROJECT_ROOT = process.cwd();
const SCANNED_DIRS = ['app', 'components', 'lib/navigation'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

function collectSourceFiles(dir: string): string[] {
  const absoluteDir = path.join(PROJECT_ROOT, dir);
  if (!fs.existsSync(absoluteDir)) return [];

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === '__tests__') continue;
    const absolutePath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(path.relative(PROJECT_ROOT, absolutePath)));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectHardcodedRouteStrings() {
  const routeMatches: { file: string; route: string }[] = [];
  const routeStringPatterns = [
    /router\.(?:push|replace)\(\s*['"`]([^'"`]+)['"`]/g,
    /pathname:\s*['"`]([^'"`]+)['"`]/g,
    /href=\{?\s*['"`]([^'"`]+)['"`]/g,
  ];

  for (const filePath of SCANNED_DIRS.flatMap(collectSourceFiles)) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const pattern of routeStringPatterns) {
      for (const match of source.matchAll(pattern)) {
        const route = match[1];
        if (!route?.startsWith('/')) continue;
        routeMatches.push({
          file: path.relative(PROJECT_ROOT, filePath),
          route,
        });
      }
    }
  }

  return routeMatches;
}

describe('route inventory', () => {
  it('recognizes all central route constants and route builders', () => {
    const centralRoutes = [
      HOME_ROUTE,
      WELCOME_ROUTE,
      SIGN_IN_ROUTE,
      SIGN_UP_ROUTE,
      RESET_PASSWORD_ROUTE,
      PAYWALL_ROUTE,
      PERSONALIZATION_ROUTE,
      PROGRAM_TAB_ROUTE,
      JOURNAL_TAB_ROUTE,
      PROGRAM_START_ROUTE,
      PROGRAM_QUEUE_REVIEW_ROUTE,
      NOTIFICATION_PERMISSION_REVIEW_ROUTE,
      MY_PROGRAMS_ROUTE,
      ACCOUNT_SETTINGS_ROUTE,
      ACCOUNT_STATISTICS_ROUTE,
      ACCOUNT_CITATIONS_ROUTE,
      buildDayDetailRoute({ programSlug: 'gut_health_reset', dayNumber: 1 }),
      buildProgramCompleteRoute('gut_health_reset'),
      buildProgramReviewRoute('gut_health_reset'),
      buildPersonalizationRoute({ mode: 'realign', program: 'gut_health_reset' }),
    ].map(String);

    expect(centralRoutes.map(stripRouteQuery).every(isKnownInternalRoute)).toBe(true);
  });

  it('keeps the route inventory unique', () => {
    expect(new Set(APP_ROUTE_PATHS).size).toBe(APP_ROUTE_PATHS.length);
  });

  it('does not leave hard-coded internal navigation targets pointing at dead routes', () => {
    const invalidRoutes = collectHardcodedRouteStrings().filter(
      ({ route }) => !isExternalRoute(route) && !isKnownInternalRoute(route)
    );

    expect(invalidRoutes).toEqual([]);
  });
});
