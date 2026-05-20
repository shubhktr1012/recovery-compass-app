import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { describe, expect, it } from 'vitest';

import { resolveDay } from '@/lib/card-resolver';
import type { ContentCard, DayContent, ProgramSlug } from '@/types/content';

const MAX_TRAVERSAL_MS = 1000;

const PROGRAMS_UNDER_TEST = [
  { slug: 'ninety_day_transform', expectedDays: 90 },
  { slug: 'age_reversal', expectedDays: 90 },
] as const satisfies readonly {
  slug: ProgramSlug;
  expectedDays: number;
}[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function getCards(value: unknown, label: string): ContentCard[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must contain a non-empty cards array.`);
  }

  return value as ContentCard[];
}

function loadCanonicalProgram(slug: ProgramSlug): unknown {
  const canonicalPath = join(process.cwd(), 'content', 'canonical', `${slug}.json`);
  return JSON.parse(readFileSync(canonicalPath, 'utf8')) as unknown;
}

function getCanonicalDayRecords(rawProgram: unknown, slug: ProgramSlug): Record<string, unknown>[] {
  if (!isRecord(rawProgram)) {
    throw new Error(`${slug} canonical content must be an object.`);
  }

  if (Array.isArray(rawProgram.days)) {
    return rawProgram.days.filter(isRecord);
  }

  return Object.entries(rawProgram)
    .filter(([key, value]) => /^\d+$/.test(key) && isRecord(value))
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([, value]) => value as Record<string, unknown>);
}

function normalizeCanonicalDays(slug: ProgramSlug): DayContent[] {
  return getCanonicalDayRecords(loadCanonicalProgram(slug), slug).map((day, index) => {
    const dayNumber = getNumber(day.dayNumber) ?? index + 1;
    const dayTitle = getString(day.dayTitle) ?? getString(day.title) ?? `Day ${dayNumber}`;

    return {
      programSlug: slug,
      dayNumber,
      dayTitle,
      estimatedMinutes: getNumber(day.estimatedMinutes),
      cards: getCards(day.cards, `${slug} day ${dayNumber}`),
    };
  });
}

describe('90-day program resolver traversal', () => {
  it.each(PROGRAMS_UNDER_TEST)(
    'resolves every canonical day for $slug within the performance budget',
    ({ slug, expectedDays }) => {
      const days = normalizeCanonicalDays(slug);

      expect(days).toHaveLength(expectedDays);
      expect(days.map((day) => day.dayNumber)).toEqual(
        Array.from({ length: expectedDays }, (_, index) => index + 1)
      );

      const startedAt = performance.now();
      const resolvedDays = days.map((day) =>
        resolveDay({
          programSlug: slug,
          dayNumber: day.dayNumber,
          contentMode: 'unique',
          dayContent: day,
        })
      );
      const durationMs = performance.now() - startedAt;

      expect(durationMs).toBeLessThan(MAX_TRAVERSAL_MS);

      for (const day of resolvedDays) {
        expect(day.programSlug).toBe(slug);
        expect(day.dayNumber).toBeGreaterThanOrEqual(1);
        expect(day.dayNumber).toBeLessThanOrEqual(expectedDays);
        expect(day.dayTitle).toEqual(expect.any(String));
        expect(day.dayTitle.trim().length).toBeGreaterThan(0);
        expect(day.estimatedMinutes).toEqual(expect.any(Number));
        expect(day.cards.length).toBeGreaterThan(0);
        expect(day.cards[0].type).toBe('intro');
        expect(day.cards[day.cards.length - 1].type).toBe('close');

        for (const card of day.cards) {
          expect(card.timeSlot).toBeDefined();
          expect(card.isTimeSensitive).toEqual(expect.any(Boolean));
          expect(card.hasEffortCheck).toEqual(expect.any(Boolean));
        }
      }
    }
  );
});
