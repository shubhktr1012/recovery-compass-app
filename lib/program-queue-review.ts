import type { OwnedProgramRecord } from '@/hooks/useOwnedPrograms';

type QueueReviewRecord = Pick<
  OwnedProgramRecord,
  'completionState' | 'currentDay' | 'programState' | 'purchaseState' | 'slug'
>;

export function isBlockingProgramRecord(record: QueueReviewRecord) {
  return (
    record.purchaseState !== 'not_owned' &&
    record.completionState !== 'completed' &&
    (record.programState === 'active' ||
      record.programState === 'scheduled' ||
      record.programState === 'paused')
  );
}

export function isDeferredQueuedProgramRecord(record: QueueReviewRecord) {
  return (
    record.purchaseState !== 'not_owned' &&
    record.completionState === 'in_progress' &&
    record.programState === 'purchased' &&
    (record.currentDay ?? 1) >= 1
  );
}

export function shouldShowProgramQueueReview({
  ownedPrograms,
  queueReviewedAt,
}: {
  ownedPrograms: QueueReviewRecord[];
  queueReviewedAt?: string | null;
}) {
  if (queueReviewedAt) {
    return false;
  }

  const activeOrQueuedPrograms = ownedPrograms.filter(
    (program) =>
      program.purchaseState !== 'not_owned' &&
      program.completionState !== 'completed' &&
      program.programState !== 'completed'
  );

  return (
    activeOrQueuedPrograms.length > 1 &&
    activeOrQueuedPrograms.some(isBlockingProgramRecord) &&
    activeOrQueuedPrograms.some(isDeferredQueuedProgramRecord)
  );
}
