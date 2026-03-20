import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ProgramContent, ProgramSlug } from '@/types/content';

import {
  CONTENT_QUERY_GC_TIME,
  CONTENT_QUERY_STALE_TIME,
  MissingContentError,
  ProgramDayRow,
  ProgramRow,
  getCachedProgram,
  getFallbackProgram,
  mapProgramDayRowToDayContent,
  mapProgramRowToProgramContent,
  programQueryKey,
} from './contentQueryUtils';

export function useProgram(programSlug: ProgramSlug | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: programSlug ? programQueryKey(programSlug) : ['program', null],
    queryFn: async (): Promise<ProgramContent> => {
      if (!programSlug) {
        throw new Error('Program slug is required.');
      }

      const [{ data: programRows, error: programError }, { data: dayRows, error: dayError }] =
        await Promise.all([
          supabase.from('programs').select('*').eq('slug', programSlug),
          supabase.from('program_days').select('*').eq('program_slug', programSlug).order('day_number'),
        ]);

      if (programError) {
        throw programError;
      }

      if (dayError) {
        throw dayError;
      }

      const programRow = ((programRows ?? []) as unknown as ProgramRow[])[0] ?? null;
      const days = ((dayRows ?? []) as unknown as ProgramDayRow[]).map((row) =>
        mapProgramDayRowToDayContent(row, programSlug)
      );

      if (!programRow) {
        throw new MissingContentError(`Program ${programSlug} was not found in Supabase.`);
      }

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
