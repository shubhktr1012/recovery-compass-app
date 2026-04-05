import { ProgramSlug } from '../programs/types';
import {
  DEFAULT_NINETY_DAY_REVENUECAT_ID,
  DEFAULT_SIX_DAY_REVENUECAT_ID,
  NINETY_DAY_REVENUECAT_ALIASES,
  SIX_DAY_REVENUECAT_ALIASES,
} from './identifiers';

export interface RevenueCatProgramDefinition {
  aliases: string[];
  displayName: string;
  entitlementId: string;
  legacyTier: 'short' | 'full';
  productIds: string[];
  programSlug: ProgramSlug;
  searchTokens: string[];
}

export interface RevenueCatCatalogInput {
  ageReversalEntitlementId?: string | null;
  ageReversalProductIds?: string[] | null;
  energyVitalityEntitlementId?: string | null;
  energyVitalityProductIds?: string[] | null;
  maleVitalityEntitlementId?: string | null;
  maleVitalityProductIds?: string[] | null;
  ninetyDayEntitlementId?: string | null;
  ninetyDayProductIds?: string[] | null;
  sleepResetEntitlementId?: string | null;
  sleepResetProductIds?: string[] | null;
  sixDayEntitlementId?: string | null;
  sixDayProductIds?: string[] | null;
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function normalizeList(values: (string | null | undefined)[]) {
  return values
    .map((value) => normalize(value))
    .filter(Boolean);
}

export function createRevenueCatCatalog(input: RevenueCatCatalogInput = {}): RevenueCatProgramDefinition[] {
  return [
    {
      programSlug: 'ninety_day_transform',
      displayName: '90-Day Smoking Reset',
      entitlementId: input.ninetyDayEntitlementId?.trim() || DEFAULT_NINETY_DAY_REVENUECAT_ID,
      productIds: normalizeList(input.ninetyDayProductIds ?? [DEFAULT_NINETY_DAY_REVENUECAT_ID]),
      aliases: normalizeList([...NINETY_DAY_REVENUECAT_ALIASES]),
      searchTokens: normalizeList([
        '90_day',
        '90-day',
        '90day',
        'ninety_day',
        'ninety-day',
        'ninetyday',
        'quit',
        'smoking reset',
      ]),
      legacyTier: 'full',
    },
    {
      programSlug: 'six_day_reset',
      displayName: '6-Day Control',
      entitlementId: input.sixDayEntitlementId?.trim() || DEFAULT_SIX_DAY_REVENUECAT_ID,
      productIds: normalizeList(input.sixDayProductIds ?? [DEFAULT_SIX_DAY_REVENUECAT_ID]),
      aliases: normalizeList([...SIX_DAY_REVENUECAT_ALIASES]),
      searchTokens: normalizeList(['6_day', '6-day', '6day', 'six_day', 'six-day', 'sixday', 'control']),
      legacyTier: 'short',
    },
    {
      programSlug: 'age_reversal',
      displayName: '90-Day Biohacking Reset',
      entitlementId: input.ageReversalEntitlementId?.trim() || 'age_reversal',
      productIds: normalizeList(input.ageReversalProductIds ?? ['age_reversal']),
      aliases: normalizeList(['age_reversal', 'age-reversal', 'agereversal', '90_day_reversal', 'biohacking_reset']),
      searchTokens: normalizeList(['age', 'reversal', '90_day_reversal', '90-day reversal', 'biohacking', 'reset']),
      legacyTier: 'full',
    },
    {
      programSlug: 'sleep_disorder_reset',
      displayName: '21-Day Deep Sleep Reset',
      entitlementId: input.sleepResetEntitlementId?.trim() || 'sleep_disorder_reset',
      productIds: normalizeList(input.sleepResetProductIds ?? ['sleep_disorder_reset']),
      aliases: normalizeList(['sleep_disorder_reset', 'sleep-reset', 'sleep_reset', 'sleepdisorderreset']),
      searchTokens: normalizeList(['sleep', 'sleep reset', 'sleep_reset', 'sleep-disorder', 'deep sleep']),
      legacyTier: 'short',
    },
    {
      programSlug: 'energy_vitality',
      displayName: '14-Day Energy Restore',
      entitlementId: input.energyVitalityEntitlementId?.trim() || 'energy_vitality',
      productIds: normalizeList(input.energyVitalityProductIds ?? ['energy_vitality']),
      aliases: normalizeList(['energy_vitality', 'energy-reset', 'energy_reset', 'energyvitality']),
      searchTokens: normalizeList(['energy', 'vitality', 'energy reset', 'energy restore', '14-day']),
      legacyTier: 'full',
    },
    {
      programSlug: 'male_sexual_health',
      displayName: "30-Day Men's Vitality Reset",
      entitlementId: input.maleVitalityEntitlementId?.trim() || 'male_sexual_health',
      productIds: normalizeList(input.maleVitalityProductIds ?? ['male_sexual_health']),
      aliases: normalizeList(['male_sexual_health', 'male-vitality', 'male_vitality', 'malesexualhealth']),
      searchTokens: normalizeList(['male', 'vitality', 'sexual health', 'mens vitality', '30-day']),
      legacyTier: 'full',
    },
  ];
}

function exactMatchesDefinition(definition: RevenueCatProgramDefinition, candidate: string | null | undefined) {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) {
    return false;
  }

  if (definition.productIds.includes(normalizedCandidate)) {
    return true;
  }

  if (definition.aliases.includes(normalizedCandidate)) {
    return true;
  }

  return normalize(definition.entitlementId) === normalizedCandidate;
}

function fuzzyMatchesDefinition(definition: RevenueCatProgramDefinition, candidate: string | null | undefined) {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) {
    return false;
  }

  return definition.searchTokens.some((token) => normalizedCandidate.includes(token));
}

export function getProgramForEntitlementId(
  catalog: RevenueCatProgramDefinition[],
  entitlementId: string | null | undefined
) {
  const normalizedEntitlementId = normalize(entitlementId);

  return (
    catalog.find(
      (definition) =>
        normalize(definition.entitlementId) === normalizedEntitlementId ||
        definition.aliases.includes(normalizedEntitlementId)
    ) ?? null
  );
}

export function getProgramForProductId(
  catalog: RevenueCatProgramDefinition[],
  productId: string | null | undefined
) {
  return catalog.find((definition) => exactMatchesDefinition(definition, productId)) ?? null;
}

export function getProgramForCandidate(
  catalog: RevenueCatProgramDefinition[],
  candidate: string | null | undefined
) {
  return (
    catalog.find((definition) => exactMatchesDefinition(definition, candidate)) ??
    catalog.find((definition) => fuzzyMatchesDefinition(definition, candidate)) ??
    null
  );
}

export function getProgramForCandidates(
  catalog: RevenueCatProgramDefinition[],
  candidates: (string | null | undefined)[]
) {
  for (const candidate of candidates) {
    const exactMatch = catalog.find((definition) => exactMatchesDefinition(definition, candidate));
    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const candidate of candidates) {
    const fuzzyMatch = catalog.find((definition) => fuzzyMatchesDefinition(definition, candidate));
    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  for (const definition of catalog) {
    if (candidates.some((candidate) => normalize(definition.entitlementId) === normalize(candidate))) {
      return definition;
    }
  }

  return null;
}
