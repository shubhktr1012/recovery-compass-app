import type {
  ContentCard,
  DayContent,
  ProgramCatalogEntry,
  ProgramCategory,
  ProgramContent,
  ProgramContentStatus,
  ProgramSlug,
} from '@/types/content';
import { resolveDay } from '@/lib/card-resolver';
import type { ContentMode, ProgressionRow, ProgramTemplate } from '@/types/resolver';

import { PROGRAM_METADATA } from '@/content/programs/metadata';
import { ContentRepository } from '@/content/repository';
import type { QueryClient } from '@tanstack/react-query';

export const CONTENT_QUERY_STALE_TIME = 30 * 60 * 1000;
export const CONTENT_QUERY_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export const PROGRAMS_QUERY_KEY = ['programs'] as const;
export const programQueryKey = (programSlug: ProgramSlug) => ['program', programSlug] as const;
export const programDayQueryKey = (programSlug: ProgramSlug, dayNumber: number) =>
  ['program-day', programSlug, dayNumber] as const;

export class MissingContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingContentError';
  }
}

const PROGRAM_SLUGS = Object.keys(PROGRAM_METADATA) as ProgramSlug[];
const PROGRAM_CATEGORIES = ['smoking', 'sleep', 'energy', 'aging', 'sexual_health', 'gut_health'] as const;

export type ProgramRow = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  total_days: number | null;
  category: string | null;
  has_audio: boolean | null;
  display_order: number | null;
  is_active: boolean | null;
  content_mode: string | null;
  time_slots_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProgramDayRow = {
  id: string;
  program_id: string;
  program_slug: string | null;
  day_number: number;
  title: string;
  day_title: string | null;
  estimated_minutes: number | null;
  cards: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export type ProgramTemplateRow = {
  id?: string;
  program_slug: string | null;
  template_slots: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProgramProgressionRow = {
  id?: string;
  program_slug: string | null;
  day_number: number;
  day_title: string;
  phase?: string | null;
  day_goal: string;
  variables: unknown;
  overrides?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

function isProgramSlug(value: string | null | undefined): value is ProgramSlug {
  if (!value) return false;
  return PROGRAM_SLUGS.includes(value as ProgramSlug);
}

function isProgramCategory(value: string | null | undefined): value is ProgramCategory {
  if (!value) return false;
  return PROGRAM_CATEGORIES.includes(value as ProgramCategory);
}

export function getProgramContentMode(row: Pick<ProgramRow, 'content_mode'> | null | undefined): ContentMode {
  return row?.content_mode === 'template' ? 'template' : 'unique';
}

function parseCards(value: unknown): ContentCard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const typeAliases: Record<string, ContentCard['type']> = {
    action: 'action_step',
    action_step: 'action_step',
    audio: 'audio',
    breathing: 'breathing_exercise',
    breathing_exercise: 'breathing_exercise',
    calm: 'calm_trigger',
    calm_trigger: 'calm_trigger',
    close: 'close',
    exercise: 'exercise_routine',
    exercise_routine: 'exercise_routine',
    intro: 'intro',
    journal: 'journal',
    lesson: 'lesson',
    mindfulness: 'mindfulness_exercise',
    mindfulness_exercise: 'mindfulness_exercise',
  };

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        try {
          return JSON.parse(entry);
        } catch {
          return null;
        }
      }
      return entry;
    })
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const typeValue = (entry as { type?: unknown }).type;
      if (typeof typeValue !== 'string') return null;

      const normalizedType = typeAliases[typeValue.trim().toLowerCase()];
      if (!normalizedType) return null;

      return { ...(entry as Record<string, unknown>), type: normalizedType } as ContentCard;
    })
    .filter((entry): entry is ContentCard => {
      if (!entry || typeof entry !== 'object') return false;
      const typeValue = (entry as { type?: unknown }).type;
      return typeof typeValue === 'string' && typeValue.trim().length > 0;
    });
}

function resolveContentStatus(programSlug: ProgramSlug, days: DayContent[]): ProgramContentStatus {
  if (days.length > 0) {
    return 'ready';
  }

  return PROGRAM_METADATA[programSlug]?.contentStatus ?? 'placeholder';
}

export function getFallbackProgram(programSlug: ProgramSlug): ProgramContent {
  return ContentRepository.getProgram(programSlug);
}

export function getFallbackPrograms(): ProgramContent[] {
  return ContentRepository.getPrograms();
}

export function getFallbackDay(programSlug: ProgramSlug, dayNumber: number): DayContent | null {
  return ContentRepository.getDay(programSlug, dayNumber);
}

export function mapProgramDayRowToDayContent(
  row: ProgramDayRow,
  fallbackProgramSlug: ProgramSlug
): DayContent {
  const programSlug = isProgramSlug(row.program_slug) ? row.program_slug : fallbackProgramSlug;
  const fallbackDay = getFallbackDay(programSlug, row.day_number);

  return {
    programSlug,
    dayNumber: row.day_number,
    dayTitle: row.day_title ?? row.title ?? fallbackDay?.dayTitle ?? `Day ${row.day_number}`,
    estimatedMinutes: row.estimated_minutes ?? fallbackDay?.estimatedMinutes,
    cards: parseCards(row.cards),
  };
}

function normalizeProgramSlug(value: string | null | undefined, fallbackProgramSlug: ProgramSlug): ProgramSlug {
  return isProgramSlug(value) ? value : fallbackProgramSlug;
}

export function mapProgramTemplateRow(
  row: ProgramTemplateRow,
  fallbackProgramSlug: ProgramSlug
): ProgramTemplate {
  return {
    id: row.id,
    program_slug: normalizeProgramSlug(row.program_slug, fallbackProgramSlug),
    template_slots: Array.isArray(row.template_slots) ? row.template_slots : [],
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export function mapProgramProgressionRow(
  row: ProgramProgressionRow,
  fallbackProgramSlug: ProgramSlug
): ProgressionRow {
  return {
    id: row.id,
    program_slug: normalizeProgramSlug(row.program_slug, fallbackProgramSlug),
    day_number: row.day_number,
    day_title: row.day_title,
    phase: row.phase ?? undefined,
    day_goal: row.day_goal,
    variables: row.variables && typeof row.variables === 'object' ? (row.variables as ProgressionRow['variables']) : {},
    overrides:
      row.overrides && typeof row.overrides === 'object'
        ? (row.overrides as ProgressionRow['overrides'])
        : undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export function resolveTemplateDayRow(
  programSlug: ProgramSlug,
  templateRow: ProgramTemplateRow,
  progressionRow: ProgramProgressionRow
): DayContent {
  const template = mapProgramTemplateRow(templateRow, programSlug);
  const progression = mapProgramProgressionRow(progressionRow, programSlug);

  return resolveDay({
    programSlug,
    dayNumber: progression.day_number,
    contentMode: 'template',
    template,
    progression,
  });
}

export function resolveTemplateDays(
  programSlug: ProgramSlug,
  templateRow: ProgramTemplateRow,
  progressionRows: ProgramProgressionRow[]
): DayContent[] {
  return progressionRows.map((progressionRow) => resolveTemplateDayRow(programSlug, templateRow, progressionRow));
}

export function mapProgramRowToProgramContent(
  row: ProgramRow,
  days: DayContent[]
): ProgramContent | null {
  if (!isProgramSlug(row.slug)) {
    return null;
  }

  const fallbackProgram = getFallbackProgram(row.slug);
  const mergedDays = mergeDays(days, fallbackProgram.days);

  const programCatalogEntry: ProgramCatalogEntry = {
    slug: row.slug,
    name: fallbackProgram.name,
    description: row.description ?? fallbackProgram.description,
    totalDays: row.total_days ?? fallbackProgram.totalDays,
    category: isProgramCategory(row.category) ? row.category : fallbackProgram.category,
    hasAudio: row.has_audio ?? fallbackProgram.hasAudio,
    timeSlotsEnabled: row.time_slots_enabled ?? fallbackProgram.timeSlotsEnabled,
    contentStatus: resolveContentStatus(row.slug, mergedDays),
    priceString: fallbackProgram.priceString,
    dailyMinutesLabel: fallbackProgram.dailyMinutesLabel,
    phaseCount: fallbackProgram.phaseCount,
  };

  return {
    ...programCatalogEntry,
    days: mergedDays,
  };
}

export function mergeProgramsWithFallback(rows: ProgramRow[]): ProgramContent[] {
  const fallbackPrograms = getFallbackPrograms();
  const rowsBySlug = new Map(
    rows
      .filter((row) => isProgramSlug(row.slug))
      .map((row) => [row.slug as ProgramSlug, row] as const)
  );

  return fallbackPrograms.map((fallbackProgram) => {
    const row = rowsBySlug.get(fallbackProgram.slug);
    if (!row) {
      return fallbackProgram;
    }

    return (
      mapProgramRowToProgramContent(row, fallbackProgram.days) ?? fallbackProgram
    );
  });
}

export function mergeDays(primaryDays: DayContent[], fallbackDays: DayContent[]): DayContent[] {
  const dayMap = new Map<number, DayContent>();

  for (const day of fallbackDays) {
    dayMap.set(day.dayNumber, day);
  }

  for (const day of primaryDays) {
    dayMap.set(day.dayNumber, day);
  }

  return Array.from(dayMap.values()).sort((left, right) => left.dayNumber - right.dayNumber);
}

export function getCachedPrograms(queryClient: QueryClient): ProgramContent[] | undefined {
  return queryClient.getQueryData<ProgramContent[]>(PROGRAMS_QUERY_KEY);
}

export function getCachedProgram(
  queryClient: QueryClient,
  programSlug: ProgramSlug
): ProgramContent | null {
  const exactMatch = queryClient.getQueryData<ProgramContent>(programQueryKey(programSlug));
  if (exactMatch) {
    return exactMatch;
  }

  return getCachedPrograms(queryClient)?.find((program) => program.slug === programSlug) ?? null;
}

export function getCachedDay(
  queryClient: QueryClient,
  programSlug: ProgramSlug,
  dayNumber: number
): DayContent | null {
  const exactMatch = queryClient.getQueryData<DayContent>(programDayQueryKey(programSlug, dayNumber));
  if (exactMatch) {
    return exactMatch;
  }

  return getCachedProgram(queryClient, programSlug)?.days.find((day) => day.dayNumber === dayNumber) ?? null;
}
