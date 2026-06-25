import { ProgramSlug } from '../programs/types';
import {
  DEFAULT_GUT_HEALTH_RESET_REVENUECAT_ID,
  DEFAULT_NINETY_DAY_REVENUECAT_ID,
  DEFAULT_SIX_DAY_REVENUECAT_ID,
  DEFAULT_SMOKING_ALCOHOL_QUIT_REVENUECAT_ID,
  GUT_HEALTH_RESET_REVENUECAT_ALIASES,
  NINETY_DAY_REVENUECAT_ALIASES,
  SIX_DAY_REVENUECAT_ALIASES,
  SMOKING_ALCOHOL_QUIT_REVENUECAT_ALIASES,
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
  smokingAlcoholQuitEntitlementId?: string | null;
  smokingAlcoholQuitProductIds?: string[] | null;
  sleepResetEntitlementId?: string | null;
  sleepResetProductIds?: string[] | null;
  sixDayEntitlementId?: string | null;
  sixDayProductIds?: string[] | null;
  gutHealthResetEntitlementId?: string | null;
  gutHealthResetProductIds?: string[] | null;
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
      programSlug: 'smoking_alcohol_quit',
      displayName: 'Smoking & Alcohol Quit Program',
      entitlementId:
        input.smokingAlcoholQuitEntitlementId?.trim() ||
        DEFAULT_SMOKING_ALCOHOL_QUIT_REVENUECAT_ID,
      productIds: normalizeList(
        input.smokingAlcoholQuitProductIds ?? [DEFAULT_SMOKING_ALCOHOL_QUIT_REVENUECAT_ID]
      ),
      aliases: normalizeList([...SMOKING_ALCOHOL_QUIT_REVENUECAT_ALIASES]),
      searchTokens: normalizeList([
        '21_day_smoking_alcohol',
        '21-day-smoking-alcohol',
        '21day',
        'smoking alcohol',
        'smoking_alcohol',
        'alcohol quit',
        'drinking quit',
        'quit',
      ]),
      legacyTier: 'full',
    },
    {
      programSlug: 'ninety_day_transform',
      displayName: 'Smoking Reset',
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
      displayName: 'Control',
      entitlementId: input.sixDayEntitlementId?.trim() || DEFAULT_SIX_DAY_REVENUECAT_ID,
      productIds: normalizeList(input.sixDayProductIds ?? [DEFAULT_SIX_DAY_REVENUECAT_ID]),
      aliases: normalizeList([...SIX_DAY_REVENUECAT_ALIASES]),
      searchTokens: normalizeList(['6_day', '6-day', '6day', 'six_day', 'six-day', 'sixday', 'control']),
      legacyTier: 'short',
    },
    {
      programSlug: 'age_reversal',
      displayName: 'Age Reversal Program',
      entitlementId: input.ageReversalEntitlementId?.trim() || 'age_reversal',
      productIds: normalizeList(input.ageReversalProductIds ?? ['age_reversal']),
      aliases: normalizeList(['age_reversal', 'age-reversal', 'agereversal', '90_day_reversal', 'biohacking_reset']),
      searchTokens: normalizeList(['age', 'reversal', '90_day_reversal', '90-day reversal', 'biohacking', 'reset']),
      legacyTier: 'full',
    },
    {
      programSlug: 'sleep_disorder_reset',
      displayName: 'Deep Sleep Reset Program',
      entitlementId: input.sleepResetEntitlementId?.trim() || 'sleep_disorder_reset',
      productIds: normalizeList(input.sleepResetProductIds ?? ['sleep_disorder_reset']),
      aliases: normalizeList(['sleep_disorder_reset', 'sleep-reset', 'sleep_reset', 'sleepdisorderreset']),
      searchTokens: normalizeList(['sleep', 'sleep reset', 'sleep_reset', 'sleep-disorder', 'deep sleep']),
      legacyTier: 'short',
    },
    {
      programSlug: 'energy_vitality',
      displayName: 'Energy Restore Program',
      entitlementId: input.energyVitalityEntitlementId?.trim() || 'energy_vitality',
      productIds: normalizeList(input.energyVitalityProductIds ?? ['energy_vitality']),
      aliases: normalizeList(['energy_vitality', 'energy-reset', 'energy_reset', 'energyvitality']),
      searchTokens: normalizeList(['energy', 'vitality', 'energy reset', 'energy restore', '14-day']),
      legacyTier: 'full',
    },
    {
      programSlug: 'male_sexual_health',
      displayName: "Men’s Vitality Reset Program",
      entitlementId: input.maleVitalityEntitlementId?.trim() || 'male_sexual_health',
      productIds: normalizeList(input.maleVitalityProductIds ?? ['male_sexual_health']),
      aliases: normalizeList(['male_sexual_health', 'male-vitality', 'male_vitality', 'malesexualhealth']),
      searchTokens: normalizeList(['male', 'vitality', 'sexual health', 'mens vitality', '30-day']),
      legacyTier: 'full',
    },
    {
      programSlug: 'gut_health_reset',
      displayName: 'Gut Reset Program',
      entitlementId:
        input.gutHealthResetEntitlementId?.trim() ||
        DEFAULT_GUT_HEALTH_RESET_REVENUECAT_ID,
      productIds: normalizeList(input.gutHealthResetProductIds ?? [DEFAULT_GUT_HEALTH_RESET_REVENUECAT_ID]),
      aliases: normalizeList([...GUT_HEALTH_RESET_REVENUECAT_ALIASES]),
      searchTokens: normalizeList(['gut', 'gut health', 'gut reset', 'digestive', 'digestion', '21-day']),
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
