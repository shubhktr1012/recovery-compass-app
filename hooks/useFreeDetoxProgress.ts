import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  FREE_DETOX_PROGRAM_SLUG,
  buildFreeDetoxProgressAfterDayState,
  loadFreeDetoxProgress,
  saveFreeDetoxProgress,
  type FreeProgramProgressRecord,
} from '@/lib/free-program-progress';

export const freeDetoxProgressQueryKey = (userId: string | null | undefined) => [
  'free-program-progress',
  FREE_DETOX_PROGRAM_SLUG,
  userId ?? null,
];

export function useFreeDetoxProgress(userId: string | null | undefined, enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = freeDetoxProgressQueryKey(userId);

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!userId) {
        return Promise.resolve(null);
      }

      return loadFreeDetoxProgress(userId);
    },
    enabled: Boolean(userId && enabled),
  });

  const mutation = useMutation({
    mutationFn: async (input: {
      dayNumber: number;
      progress: FreeProgramProgressRecord | null;
      requestedDayState: 'completed' | 'partial';
    }) => {
      if (!userId) {
        throw new Error('A signed-in user is required to save Detox progress.');
      }

      const nextProgress = buildFreeDetoxProgressAfterDayState({
        dayNumber: input.dayNumber,
        progress: input.progress,
        requestedDayState: input.requestedDayState,
        userId,
      });

      return saveFreeDetoxProgress({
        completedAt: nextProgress.completedAt,
        completedDays: nextProgress.completedDays,
        currentDay: nextProgress.currentDay,
        partialDays: nextProgress.partialDays,
        userId,
      });
    },
    onSuccess: (nextProgress) => {
      queryClient.setQueryData(queryKey, nextProgress);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    error: query.error ?? mutation.error ?? null,
    isLoading: query.isPending && !query.data,
    isSaving: mutation.isPending,
    progress: query.data ?? null,
    saveDayState: mutation.mutateAsync,
  };
}
