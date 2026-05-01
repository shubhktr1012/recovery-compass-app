import { useQuery } from '@tanstack/react-query';
import Purchases from 'react-native-purchases';

import type { ProgramSlug } from '@/types/content';
import type { Database } from '@/types/database.types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { getOwnedProgramsFromCustomerInfo } from '@/lib/revenuecat/config';

type ProgramAccessRow = Database['public']['Tables']['program_access']['Row'];

export interface OwnedProgramRecord {
  slug: ProgramSlug;
  purchaseState: ProgramAccessRow['purchase_state'];
  completionState: ProgramAccessRow['completion_state'];
  currentDay: ProgramAccessRow['current_day'];
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
        .select('owned_program, purchase_state, completion_state, current_day, started_at, updated_at')
        .eq('user_id', userId)
        .not('owned_program', 'is', null)
        .neq('purchase_state', 'not_owned')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const uniquePrograms = new Map<ProgramSlug, OwnedProgramRecord>();

      for (const row of (data ?? []) as Pick<
        ProgramAccessRow,
        'owned_program' | 'purchase_state' | 'completion_state' | 'current_day' | 'started_at' | 'updated_at'
      >[]) {
        const slug = row.owned_program as ProgramSlug | null;

        if (!slug || uniquePrograms.has(slug)) {
          continue;
        }

        uniquePrograms.set(slug, {
          slug,
          purchaseState: row.purchase_state,
          completionState: row.completion_state,
          currentDay: row.current_day,
          startedAt: row.started_at,
          updatedAt: row.updated_at,
        });
      }

      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const revenueCatOwnedPrograms = getOwnedProgramsFromCustomerInfo(customerInfo);

        for (const slug of revenueCatOwnedPrograms) {
          if (uniquePrograms.has(slug)) {
            continue;
          }

          uniquePrograms.set(slug, {
            slug,
            purchaseState: 'owned_active',
            completionState: 'in_progress',
            currentDay: null,
            startedAt: null,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Failed to merge RevenueCat-owned programs into library', error);
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
