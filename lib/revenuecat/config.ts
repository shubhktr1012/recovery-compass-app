import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { validatePublicEnv } from '@/lib/env';
import { ProgramSlug } from '@/lib/programs/types';
import {
  createRevenueCatCatalog,
  getProgramForCandidate,
  getProgramForCandidates,
  getProgramForEntitlementId,
  getProgramForProductId,
  RevenueCatProgramDefinition,
} from '@/lib/revenuecat/catalog';

const env = validatePublicEnv();

export const REVENUECAT_CATALOG = createRevenueCatCatalog({
  ageReversalEntitlementId: env.revenueCatAgeReversalEntitlementId,
  ageReversalProductIds: env.revenueCatAgeReversalProductIds,
  energyVitalityEntitlementId: env.revenueCatEnergyVitalityEntitlementId,
  energyVitalityProductIds: env.revenueCatEnergyVitalityProductIds,
  maleVitalityEntitlementId: env.revenueCatMaleVitalityEntitlementId,
  maleVitalityProductIds: env.revenueCatMaleVitalityProductIds,
  sixDayEntitlementId: env.revenueCatSixDayEntitlementId,
  ninetyDayEntitlementId: env.revenueCatNinetyDayEntitlementId,
  sleepResetEntitlementId: env.revenueCatSleepResetEntitlementId,
  sleepResetProductIds: env.revenueCatSleepResetProductIds,
  sixDayProductIds: env.revenueCatSixDayProductIds,
  ninetyDayProductIds: env.revenueCatNinetyDayProductIds,
});

export function getRevenueCatProgram(programSlug: ProgramSlug): RevenueCatProgramDefinition {
  const program = REVENUECAT_CATALOG.find((definition) => definition.programSlug === programSlug);

  if (!program) {
    throw new Error(`Missing RevenueCat catalog definition for ${programSlug}`);
  }

  return program;
}

export function getProgramSlugForPackage(pack: PurchasesPackage): ProgramSlug | null {
  const definition = getProgramForCandidates(REVENUECAT_CATALOG, [
    pack.identifier,
    pack.product.identifier,
    pack.product.title,
  ]);

  return definition?.programSlug ?? null;
}

export function getProgramSlugForEntitlementId(entitlementId: string | null | undefined): ProgramSlug | null {
  return getProgramForEntitlementId(REVENUECAT_CATALOG, entitlementId)?.programSlug ?? null;
}

export function getProgramSlugForProductId(productId: string | null | undefined): ProgramSlug | null {
  return getProgramForProductId(REVENUECAT_CATALOG, productId)?.programSlug ?? null;
}

export function getOwnedProgramFromCustomerInfo(customerInfo: CustomerInfo): ProgramSlug | null {
  const activeEntitlementIds = Object.keys(customerInfo.entitlements.active);
  const fromEntitlements = activeEntitlementIds
    .map((entitlementId) => getProgramSlugForEntitlementId(entitlementId))
    .find(Boolean);

  if (fromEntitlements) {
    return fromEntitlements;
  }

  const fromActiveProducts = getProgramForCandidates(REVENUECAT_CATALOG, [
    ...customerInfo.activeSubscriptions,
    ...customerInfo.allPurchasedProductIdentifiers,
  ]);

  return fromActiveProducts?.programSlug ?? null;
}

export function getDisplayNameForProgram(programSlug: ProgramSlug | null) {
  if (!programSlug) {
    return 'Recovery Compass Program';
  }

  return getRevenueCatProgram(programSlug).displayName;
}

export function getLegacyTierForProgram(programSlug: ProgramSlug | null) {
  if (!programSlug) {
    return 'free';
  }

  return getRevenueCatProgram(programSlug).legacyTier;
}

export function hasConfiguredRevenueCatProductIds() {
  return REVENUECAT_CATALOG.every((definition) => definition.productIds.length > 0);
}

export function getRevenueCatProgramForCandidate(candidate: string | null | undefined) {
  return getProgramForCandidate(REVENUECAT_CATALOG, candidate);
}
