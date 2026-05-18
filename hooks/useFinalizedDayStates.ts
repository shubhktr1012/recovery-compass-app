import { useQuery } from '@tanstack/react-query';

import type { FinalizedDayState } from '@/lib/day-state-summary';
import { supabase } from '@/lib/supabase';
import type { ProgramSlug } from '@/types/content';

type UserDayStateRow = {
  day_number: number;
  day_state: string;
  cards_opened: number;
  cards_completed: number;
  cards_total: number;
  completion_percentage: number | string;
  finalized_at: string | null;
};

export const finalizedDayStatesQueryKey = (userId: string | null | undefined, programSlug: ProgramSlug | null | undefined) =>
  ['user-day-states', userId ?? null, programSlug ?? null] as const;
export const EMPTY_FINALIZED_DAY_STATES: FinalizedDayState[] = [];

function isFinalizedDayState(value: string): value is FinalizedDayState['dayState'] {
  return value === 'completed' || value === 'partial' || value === 'skipped';
}

function mapUserDayStateRow(row: UserDayStateRow): FinalizedDayState | null {
  if (!isFinalizedDayState(row.day_state)) {
    return null;
  }

  return {
    dayNumber: row.day_number,
    dayState: row.day_state,
    cardsOpened: row.cards_opened,
    cardsCompleted: row.cards_completed,
    cardsTotal: row.cards_total,
    completionPercentage: Number(row.completion_percentage ?? 0),
    finalizedAt: row.finalized_at,
  };
}

export function useFinalizedDayStates(userId: string | null | undefined, programSlug: ProgramSlug | null | undefined) {
  return useQuery({
    queryKey: finalizedDayStatesQueryKey(userId, programSlug),
    queryFn: async () => {
      if (!userId || !programSlug) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_day_states')
        .select('day_number, day_state, cards_opened, cards_completed, cards_total, completion_percentage, finalized_at')
        .eq('user_id', userId)
        .eq('program_slug', programSlug)
        .order('day_number', { ascending: true });

      if (error) {
        throw error;
      }

      return ((data ?? []) as UserDayStateRow[])
        .map(mapUserDayStateRow)
        .filter((row): row is FinalizedDayState => Boolean(row));
    },
    enabled: Boolean(userId && programSlug),
    staleTime: 15 * 1000,
  });
}
