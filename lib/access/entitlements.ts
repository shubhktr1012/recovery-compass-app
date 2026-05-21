import type { OwnedProgramRecord } from '@/hooks/useOwnedPrograms';
import type {
  ProgramAccessSnapshot,
  ProgramLifecycleState,
  ProgramSlug,
  PurchaseState,
} from '@/lib/programs/types';

export type PremiumAccessReason =
  | 'active_access'
  | 'completed_review_access'
  | 'owned_program_access';

export interface PremiumAccessDecision {
  allowed: boolean;
  reason: PremiumAccessReason | 'not_owned';
}

type AccessSource = ProgramAccessSnapshot['source'];

export function isOwnedPurchaseState(purchaseState?: PurchaseState | string | null) {
  return Boolean(purchaseState && purchaseState !== 'not_owned');
}

export function isTrustedAccessSource(source?: AccessSource | null) {
  return source === undefined || source === 'supabase';
}

export function hasAnyProgramEntitlement(
  access: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'purchaseState'> & { source?: AccessSource | null }
) {
  return Boolean(
    access.ownedProgram &&
    isOwnedPurchaseState(access.purchaseState) &&
    isTrustedAccessSource(access.source)
  );
}

export function canAccessProgramContent(
  access: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'purchaseState'> & { source?: AccessSource | null },
  programSlug: ProgramSlug | string | null | undefined
): PremiumAccessDecision {
  if (!programSlug || !access.ownedProgram || access.ownedProgram !== programSlug) {
    return { allowed: false, reason: 'not_owned' };
  }

  if (!isOwnedPurchaseState(access.purchaseState)) {
    return { allowed: false, reason: 'not_owned' };
  }

  if (!isTrustedAccessSource(access.source)) {
    return { allowed: false, reason: 'not_owned' };
  }

  return { allowed: true, reason: 'active_access' };
}

export function canAccessOwnedProgramRecord(
  ownedPrograms: readonly Pick<OwnedProgramRecord, 'slug' | 'purchaseState'>[],
  programSlug: ProgramSlug | string | null | undefined
): PremiumAccessDecision {
  if (!programSlug) {
    return { allowed: false, reason: 'not_owned' };
  }

  const ownedRecord = ownedPrograms.find(
    (program) => program.slug === programSlug && isOwnedPurchaseState(program.purchaseState)
  );

  return ownedRecord
    ? { allowed: true, reason: 'owned_program_access' }
    : { allowed: false, reason: 'not_owned' };
}

export function canReviewCompletedProgram(
  ownedPrograms: readonly Pick<OwnedProgramRecord, 'slug' | 'purchaseState' | 'completionState' | 'programState'>[],
  programSlug: ProgramSlug | string | null | undefined
): PremiumAccessDecision {
  if (!programSlug) {
    return { allowed: false, reason: 'not_owned' };
  }

  const completedRecord = ownedPrograms.find(
    (program) =>
      program.slug === programSlug &&
      isOwnedPurchaseState(program.purchaseState) &&
      (program.purchaseState === 'owned_completed' ||
        program.completionState === 'completed' ||
        program.programState === 'completed')
  );

  return completedRecord
    ? { allowed: true, reason: 'completed_review_access' }
    : { allowed: false, reason: 'not_owned' };
}

export function canAccessProgramStartSetup(
  access: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'purchaseState' | 'programState'> & { source?: AccessSource | null }
) {
  return hasAnyProgramEntitlement(access) && access.programState === 'purchased';
}

export function hasStartedProgramLifecycle(programState?: ProgramLifecycleState | null) {
  return programState === 'scheduled' || programState === 'active' || programState === 'paused';
}
