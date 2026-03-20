import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { ProgramContent } from '@/types/content';

import {
  CONTENT_QUERY_GC_TIME,
  CONTENT_QUERY_STALE_TIME,
  MissingContentError,
  PROGRAMS_QUERY_KEY,
  ProgramRow,
  getCachedPrograms,
  getFallbackPrograms,
  mergeProgramsWithFallback,
} from './contentQueryUtils';

export function usePrograms() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: async (): Promise<ProgramContent[]> => {
      const { data, error } = await supabase.from('programs').select('*');

      if (error) {
        throw error;
      }

      const rows = ((data ?? []) as unknown as ProgramRow[])
        .filter((row) => row.is_active !== false)
        .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0));

      if (rows.length === 0) {
        throw new MissingContentError('No programs are available in Supabase yet.');
      }

      return mergeProgramsWithFallback(rows);
    },
    staleTime: CONTENT_QUERY_STALE_TIME,
    gcTime: CONTENT_QUERY_GC_TIME,
  });

  return {
    programs: query.data ?? getCachedPrograms(queryClient) ?? getFallbackPrograms(),
    isLoading: query.isPending && !query.data,
    error: query.error ?? null,
  };
}
