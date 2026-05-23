import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useOwnedPrograms } from '@/hooks/useOwnedPrograms';
import { isMissingColumnError } from '@/lib/db-compat';
import {
  isBlockingProgramRecord,
  isDeferredQueuedProgramRecord,
  shouldShowProgramQueueReview,
} from '@/lib/program-queue-review';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import type { ProgramSlug } from '@/types/content';

type QueueReviewPreference = {
  active_program: string | null;
  queue_reviewed_at: string | null;
};

export const PROGRAM_QUEUE_REVIEW_QUERY_ROOT = ['program-queue-review'] as const;
export const programQueueReviewQueryKey = (userId: string | null) => [
  ...PROGRAM_QUEUE_REVIEW_QUERY_ROOT,
  userId,
] as const;

export function useProgramQueueReviewStatus() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { ownedPrograms, isLoading: isOwnedProgramsLoading } = useOwnedPrograms();
  const preferenceQuery = useQuery({
    queryKey: programQueueReviewQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<QueueReviewPreference | null> => {
      if (!userId) {
        return null;
      }

      let { data, error }: { data: QueueReviewPreference | null; error: unknown } = await supabase
        .from('user_program_preferences')
        .select('active_program, queue_reviewed_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && isMissingColumnError(error, 'queue_reviewed_at')) {
        const legacyResult = await supabase
          .from('user_program_preferences')
          .select('active_program')
          .eq('user_id', userId)
          .maybeSingle();

        data = legacyResult.data
          ? { active_program: legacyResult.data.active_program, queue_reviewed_at: null }
          : null;
        error = legacyResult.error;
      }

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 60 * 1000,
  });

  const activeProgram = useMemo(
    () => ownedPrograms.find(isBlockingProgramRecord) ?? null,
    [ownedPrograms]
  );
  const queuedPrograms = useMemo(
    () =>
      ownedPrograms.filter(
        (program) =>
          program.purchaseState !== 'not_owned' &&
          program.completionState !== 'completed' &&
          program.programState === 'purchased'
      ),
    [ownedPrograms]
  );
  const deferredPrograms = useMemo(
    () => ownedPrograms.filter(isDeferredQueuedProgramRecord),
    [ownedPrograms]
  );
  const queueReviewedAt = preferenceQuery.data?.queue_reviewed_at ?? null;
  const shouldReviewQueue = shouldShowProgramQueueReview({
    ownedPrograms,
    queueReviewedAt,
  });
  const preferredActiveProgram =
    (preferenceQuery.data?.active_program as ProgramSlug | null | undefined) ?? activeProgram?.slug ?? null;

  return {
    activeProgram,
    deferredPrograms,
    error: preferenceQuery.error ?? null,
    isLoading:
      isOwnedProgramsLoading ||
      (preferenceQuery.isPending && !preferenceQuery.data && Boolean(userId)),
    ownedPrograms,
    preferredActiveProgram,
    queueReviewedAt,
    queuedPrograms,
    shouldReviewQueue,
  };
}
