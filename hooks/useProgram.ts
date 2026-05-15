import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ProgramContent, ProgramSlug } from '@/types/content';

import {
  CONTENT_QUERY_GC_TIME,
  CONTENT_QUERY_STALE_TIME,
  MissingContentError,
  ProgramDayRow,
  ProgramProgressionRow,
  ProgramRow,
  ProgramTemplateRow,
  getCachedProgram,
  getFallbackProgram,
  getProgramContentMode,
  mapProgramDayRowToDayContent,
  mapProgramRowToProgramContent,
  programQueryKey,
  resolveTemplateDays,
} from './contentQueryUtils';

export function useProgram(programSlug: ProgramSlug | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: programSlug ? programQueryKey(programSlug) : ['program', null],
    queryFn: async (): Promise<ProgramContent> => {
      if (!programSlug) {
        throw new Error('Program slug is required.');
      }

      const { data: programRows, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', programSlug);

      if (programError) {
        throw programError;
      }

      const programRow = ((programRows ?? []) as unknown as ProgramRow[])[0] ?? null;

      if (!programRow) {
        throw new MissingContentError(`Program ${programSlug} was not found in Supabase.`);
      }

      const days =
        getProgramContentMode(programRow) === 'template'
          ? await loadTemplateDays(programSlug)
          : await loadUniqueDays(programSlug);

      const program = mapProgramRowToProgramContent(programRow, days);
      if (!program) {
        throw new MissingContentError(`Program ${programSlug} could not be mapped from Supabase.`);
      }

      return program;
    },
    enabled: Boolean(programSlug),
    staleTime: CONTENT_QUERY_STALE_TIME,
    gcTime: CONTENT_QUERY_GC_TIME,
  });

  return {
    program:
      query.data ??
      (programSlug ? getCachedProgram(queryClient, programSlug) ?? getFallbackProgram(programSlug) : null),
    isLoading: query.isPending && !query.data,
    error: query.error ?? null,
  };
}

async function loadUniqueDays(programSlug: ProgramSlug): Promise<ProgramContent['days']> {
  const { data, error } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_slug', programSlug)
    .order('day_number');

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as ProgramDayRow[]).map((row) => mapProgramDayRowToDayContent(row, programSlug));
}

async function loadTemplateDays(programSlug: ProgramSlug): Promise<ProgramContent['days']> {
  const [{ data: templateData, error: templateError }, { data: progressionData, error: progressionError }] =
    await Promise.all([
      supabase.from('program_templates').select('*').eq('program_slug', programSlug).single(),
      supabase.from('program_progressions').select('*').eq('program_slug', programSlug).order('day_number'),
    ]);

  if (templateError) {
    throw templateError;
  }

  if (progressionError) {
    throw progressionError;
  }

  const templateRow = (templateData as unknown as ProgramTemplateRow | null) ?? null;
  const progressionRows = (progressionData ?? []) as unknown as ProgramProgressionRow[];

  if (!templateRow) {
    throw new MissingContentError(`Program template for ${programSlug} was not found in Supabase.`);
  }

  return resolveTemplateDays(programSlug, templateRow, progressionRows);
}
