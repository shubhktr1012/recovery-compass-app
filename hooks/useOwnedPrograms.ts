import { useQuery } from '@tanstack/react-query';
import type { ProgramSlug } from '@/types/content';
import type { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';

type ProgramAccessRow = Database['public']['Tables']['program_access']['Row'];

export interface OwnedProgramRecord {
  slug: ProgramSlug;
  purchaseState: ProgramAccessRow['purchase_state'];
  completionState: ProgramAccessRow['completion_state'];
  programState: ProgramAccessRow['program_state'];
  currentDay: ProgramAccessRow['current_day'];
  scheduledStartDate: ProgramAccessRow['scheduled_start_date'];
  pausedAt: ProgramAccessRow['paused_at'];
  priorityRank: ProgramAccessRow['priority_rank'];
  startedAt: ProgramAccessRow['started_at'];
  updatedAt: ProgramAccessRow['updated_at'];
}

export const OWNED_PROGRAMS_QUERY_ROOT = ['owned-programs'] as const;
export const ownedProgramsQueryKey = (userId: string | null) => [...OWNED_PROGRAMS_QUERY_ROOT, userId] as const;

export function useOwnedPrograms() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ownedProgramsQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<OwnedProgramRecord[]> => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('program_access')
        .select('owned_program, purchase_state, completion_state, program_state, current_day, scheduled_start_date, paused_at, priority_rank, started_at, updated_at')
        .eq('user_id', userId)
        .not('owned_program', 'is', null)
        .neq('purchase_state', 'not_owned')
        .order('priority_rank', { ascending: true, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const uniquePrograms = new Map<ProgramSlug, OwnedProgramRecord>();

      for (const row of (data ?? []) as Pick<
        ProgramAccessRow,
        | 'owned_program'
        | 'purchase_state'
        | 'completion_state'
        | 'program_state'
        | 'current_day'
        | 'scheduled_start_date'
        | 'paused_at'
        | 'priority_rank'
        | 'started_at'
        | 'updated_at'
      >[]) {
        const slug = row.owned_program as ProgramSlug | null;

        if (!slug || uniquePrograms.has(slug)) {
          continue;
        }

        uniquePrograms.set(slug, {
          slug,
          purchaseState: row.purchase_state,
          completionState: row.completion_state,
          programState: row.program_state,
          currentDay: row.current_day,
          scheduledStartDate: row.scheduled_start_date,
          pausedAt: row.paused_at,
          priorityRank: row.priority_rank,
          startedAt: row.started_at,
          updatedAt: row.updated_at,
        });
      }

      return [...uniquePrograms.values()];
    },
    staleTime: 60 * 1000,
  });

  return {
    ownedPrograms: query.data ?? [],
    isLoading: query.isPending && !query.data,
    error: query.error ?? null,
  };
}
