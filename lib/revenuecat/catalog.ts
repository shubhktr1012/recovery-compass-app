import { ProgramSlug } from '../programs/types';

export interface RevenueCatProgramDefinition {
  aliases: string[];
  displayName: string;
  entitlementId: string;
  legacyTier: '6-day' | '90-day';
  productIds: string[];
  programSlug: ProgramSlug;
  searchTokens: string[];
}

export interface RevenueCatCatalogInput {
  ninetyDayEntitlementId?: string | null;
  ninetyDayProductIds?: string[] | null;
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
      displayName: '90-Day Quit',
      entitlementId: input.ninetyDayEntitlementId?.trim() || '90_day_transform',
      productIds: normalizeList(input.ninetyDayProductIds ?? ['90_day_transform']),
      aliases: normalizeList(['90_day_transform', '90-day-transform', '90daytransform']),
      searchTokens: normalizeList(['90_day', '90-day', '90day', 'ninety_day', 'ninety-day', 'ninetyday']),
      legacyTier: '90-day',
    },
    {
      programSlug: 'six_day_reset',
      displayName: '6-Day Control',
      entitlementId: input.sixDayEntitlementId?.trim() || '6_day_reset',
      productIds: normalizeList(input.sixDayProductIds ?? ['6_day_reset']),
      aliases: normalizeList(['6_day_reset', '6-day-reset', '6dayreset']),
      searchTokens: normalizeList(['6_day', '6-day', '6day', 'six_day', 'six-day', 'sixday']),
      legacyTier: '6-day',
    },
  ];
}

function matchesDefinition(definition: RevenueCatProgramDefinition, candidate: string | null | undefined) {
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
  return catalog.find((definition) => matchesDefinition(definition, productId)) ?? null;
}

export function getProgramForCandidate(
  catalog: RevenueCatProgramDefinition[],
  candidate: string | null | undefined
) {
  return catalog.find((definition) => matchesDefinition(definition, candidate)) ?? null;
}

export function getProgramForCandidates(
  catalog: RevenueCatProgramDefinition[],
  candidates: (string | null | undefined)[]
) {
  for (const definition of catalog) {
    if (candidates.some((candidate) => matchesDefinition(definition, candidate))) {
      return definition;
    }
  }

  return null;
}
