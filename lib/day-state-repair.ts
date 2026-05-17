import { PROGRAM_METADATA } from '@/content/programs/metadata';
import {
  MissingContentError,
  ProgramDayRow,
  ProgramProgressionRow,
  ProgramRow,
  ProgramTemplateRow,
  getProgramContentMode,
  mapProgramDayRowToDayContent,
  resolveTemplateDayRow,
} from '@/hooks/contentQueryUtils';
import { buildUserDayStateRecord, upsertUserDayState } from '@/lib/day-states';
import { getProgramLastFinalizedDay } from '@/lib/programs/schedule';
import type { ProgramAccessSnapshot, ProgramProgressRecord } from '@/lib/programs/types';
import { supabase } from '@/lib/supabase';
import type { DayContent, ProgramSlug } from '@/types/content';

type ExistingDayStateRow = {
  day_number: number;
};

export function getSkippedDayNumbersForRepair(args: {
  startedAt: string | Date | null | undefined;
  totalDays: number;
  completedDays?: number[];
  partialDays?: number[];
  existingDayStateDays?: number[];
  now?: Date;
}) {
  const lastFinalizedDay = getProgramLastFinalizedDay(args.startedAt, args.totalDays, args.now ?? new Date());
  if (lastFinalizedDay <= 0) {
    return [];
  }

  const alreadyFinalized = new Set([
    ...(args.completedDays ?? []),
    ...(args.partialDays ?? []),
    ...(args.existingDayStateDays ?? []),
  ]);

  return Array.from({ length: lastFinalizedDay }, (_, index) => index + 1).filter(
    (dayNumber) => !alreadyFinalized.has(dayNumber)
  );
}

async function loadDayContent(programSlug: ProgramSlug, dayNumber: number): Promise<DayContent | null> {
  const { data: programData, error: programError } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', programSlug)
    .single();

  if (programError) {
    throw programError;
  }

  const programRow = (programData as unknown as ProgramRow | null) ?? null;
  if (!programRow) {
    throw new MissingContentError(`Program ${programSlug} was not found in Supabase.`);
  }

  if (getProgramContentMode(programRow) === 'template') {
    const [{ data: templateData, error: templateError }, { data: progressionData, error: progressionError }] =
      await Promise.all([
        supabase.from('program_templates').select('*').eq('program_slug', programSlug).single(),
        supabase
          .from('program_progressions')
          .select('*')
          .eq('program_slug', programSlug)
          .eq('day_number', dayNumber)
          .single(),
      ]);

    if (templateError) {
      throw templateError;
    }

    if (progressionError) {
      throw progressionError;
    }

    const templateRow = (templateData as unknown as ProgramTemplateRow | null) ?? null;
    const progressionRow = (progressionData as unknown as ProgramProgressionRow | null) ?? null;

    if (!templateRow || !progressionRow) {
      throw new MissingContentError(`Template day ${dayNumber} for ${programSlug} was not found in Supabase.`);
    }

    return resolveTemplateDayRow(programSlug, templateRow, progressionRow);
  }

  const { data: dayData, error: dayError } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_slug', programSlug)
    .eq('day_number', dayNumber)
    .single();

  if (dayError) {
    throw dayError;
  }

  const row = (dayData as unknown as ProgramDayRow | null) ?? null;
  return row ? mapProgramDayRowToDayContent(row, programSlug) : null;
}

export async function repairSkippedDayStatesOnForeground(args: {
  userId: string;
  access: ProgramAccessSnapshot;
  progress: ProgramProgressRecord | null;
  now?: Date;
}) {
  const programSlug = args.access.ownedProgram;
  if (!programSlug || !args.access.startedAt || args.access.purchaseState === 'not_owned') {
    return [];
  }

  const totalDays = PROGRAM_METADATA[programSlug].totalDays;
  const lastFinalizedDay = getProgramLastFinalizedDay(args.access.startedAt, totalDays, args.now ?? new Date());
  if (lastFinalizedDay <= 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_day_states')
    .select('day_number')
    .eq('user_id', args.userId)
    .eq('program_slug', programSlug)
    .lte('day_number', lastFinalizedDay);

  if (error) {
    throw error;
  }

  const skippedDayNumbers = getSkippedDayNumbersForRepair({
    startedAt: args.access.startedAt,
    totalDays,
    completedDays: args.progress?.completedDays ?? [],
    partialDays: args.progress?.partialDays ?? [],
    existingDayStateDays: ((data ?? []) as ExistingDayStateRow[]).map((row) => row.day_number),
    now: args.now,
  });

  for (const dayNumber of skippedDayNumbers) {
    const day = await loadDayContent(programSlug, dayNumber);
    if (!day) {
      continue;
    }

    await upsertUserDayState(
      buildUserDayStateRecord({
        userId: args.userId,
        day,
        requestedDayState: 'skipped',
        currentIndex: -1,
        cardStates: day.cards.map(() => 'skipped'),
        finalizedAt: (args.now ?? new Date()).toISOString(),
      })
    );
  }

  return skippedDayNumbers;
}
