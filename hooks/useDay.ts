import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { DayContent, ProgramSlug } from '@/types/content';

import {
  CONTENT_QUERY_GC_TIME,
  CONTENT_QUERY_STALE_TIME,
  MissingContentError,
  ProgramDayRow,
  getCachedDay,
  getFallbackDay,
  mapProgramDayRowToDayContent,
  programDayQueryKey,
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

      const { data, error } = await supabase
        .from('program_days')
        .select('*')
        .eq('program_slug', programSlug)
        .eq('day_number', dayNumber)
        .single();

      if (error) {
        throw error;
      }

      const row = (data as unknown as ProgramDayRow | null) ?? null;

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
