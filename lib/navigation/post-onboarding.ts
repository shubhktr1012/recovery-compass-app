import type { Href } from 'expo-router';

import { hasAnyProgramEntitlement } from '@/lib/access/entitlements';
import type { ProgramAccessSnapshot } from '@/lib/programs/types';
import { HOME_ROUTE, PAYWALL_ROUTE, PROGRAM_START_ROUTE } from '@/lib/navigation/routes';

export function getPostOnboardingRoute({
  access,
  accessIsVerified = false,
  freeTierActivatedAt,
}: {
  access: Pick<ProgramAccessSnapshot, 'ownedProgram' | 'purchaseState' | 'programState'>;
  accessIsVerified?: boolean;
  freeTierActivatedAt?: string | null;
}): Href {
  if (accessIsVerified && hasAnyProgramEntitlement(access)) {
    return access.programState === 'purchased' ? PROGRAM_START_ROUTE : HOME_ROUTE;
  }

  return freeTierActivatedAt ? HOME_ROUTE : PAYWALL_ROUTE;
}
