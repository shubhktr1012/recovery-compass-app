import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { DayContent, ProgramSlug } from '@/types/content';

import {
  CONTENT_QUERY_GC_TIME,
  CONTENT_QUERY_STALE_TIME,
  MissingContentError,
  ProgramDayRow,
  ProgramProgressionRow,
  ProgramRow,
  ProgramTemplateRow,
  getCachedDay,
  getFallbackDay,
  getProgramContentMode,
  mapProgramDayRowToDayContent,
  programDayQueryKey,
  resolveTemplateDayRow,
} from './contentQueryUtils';

export function useDay(programSlug: ProgramSlug | null, dayNumber: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey:
      programSlug && dayNumber
        ? programDayQueryKey(programSlug, dayNumber)
        : ['program-day', null, null],
    queryFn: async (): Promise<DayContent | null> => {
      if (!programSlug || !dayNumber) {
        return null;
      }

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

      if (!row) {
        throw new MissingContentError(`Day ${dayNumber} for ${programSlug} was not found in Supabase.`);
      }

      return mapProgramDayRowToDayContent(row, programSlug);
    },
    enabled: Boolean(programSlug && dayNumber),
    staleTime: CONTENT_QUERY_STALE_TIME,
    gcTime: CONTENT_QUERY_GC_TIME,
  });

  return {
    day:
      query.data ??
      (programSlug && dayNumber
        ? getCachedDay(queryClient, programSlug, dayNumber) ?? getFallbackDay(programSlug, dayNumber)
        : null),
    isLoading: query.isPending && !query.data,
    error: query.error ?? null,
  };
}
