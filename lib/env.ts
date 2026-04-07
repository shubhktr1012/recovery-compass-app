import {
  DEFAULT_NINETY_DAY_REVENUECAT_ID,
  DEFAULT_SIX_DAY_REVENUECAT_ID,
} from '@/lib/revenuecat/identifiers';

const FALLBACK_SUPABASE_URL = 'https://placeholder.invalid';
const FALLBACK_SUPABASE_ANON_KEY = 'missing-public-anon-key';

export interface PublicEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  revenueCatAppleKey: string | null;
  revenueCatGoogleKey: string | null;
  revenueCatSixDayEntitlementId: string;
  revenueCatNinetyDayEntitlementId: string;
  revenueCatAgeReversalEntitlementId: string;
  revenueCatSleepResetEntitlementId: string;
  revenueCatEnergyVitalityEntitlementId: string;
  revenueCatMaleVitalityEntitlementId: string;
  revenueCatSixDayProductIds: string[];
  revenueCatNinetyDayProductIds: string[];
  revenueCatAgeReversalProductIds: string[];
  revenueCatSleepResetProductIds: string[];
  revenueCatEnergyVitalityProductIds: string[];
  revenueCatMaleVitalityProductIds: string[];
  googleWebClientId: string | null;
  googleIosClientId: string | null;
  googleAndroidClientId: string | null;
  easProjectId: string | null;
  programAudioBucket: string;
}

export interface PublicEnvState {
  env: PublicEnv;
  errorMessage: string | null;
  isValid: boolean;
  missingRequiredKeys: readonly string[];
}

let cachedPublicEnvState: PublicEnvState | null = null;

function parseCsvEnv(value: string | null | undefined) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildPublicEnvState(): PublicEnvState {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;
  const missingKeys = [
    !process.env.EXPO_PUBLIC_SUPABASE_URL ? 'EXPO_PUBLIC_SUPABASE_URL' : null,
    !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'EXPO_PUBLIC_SUPABASE_ANON_KEY' : null,
  ].filter((key): key is string => Boolean(key));

  return {
    env: {
      supabaseUrl,
      supabaseAnonKey,
      revenueCatAppleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? null,
      revenueCatGoogleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? null,
      revenueCatSixDayEntitlementId:
        process.env.EXPO_PUBLIC_RC_6_DAY_ENTITLEMENT_ID ?? DEFAULT_SIX_DAY_REVENUECAT_ID,
      revenueCatNinetyDayEntitlementId:
        process.env.EXPO_PUBLIC_RC_90_DAY_ENTITLEMENT_ID ?? DEFAULT_NINETY_DAY_REVENUECAT_ID,
      revenueCatAgeReversalEntitlementId: process.env.EXPO_PUBLIC_RC_AGE_REVERSAL_ENTITLEMENT_ID ?? 'age_reversal',
      revenueCatSleepResetEntitlementId:
        process.env.EXPO_PUBLIC_RC_SLEEP_RESET_ENTITLEMENT_ID ?? 'sleep_disorder_reset',
      revenueCatEnergyVitalityEntitlementId:
        process.env.EXPO_PUBLIC_RC_ENERGY_VITALITY_ENTITLEMENT_ID ?? 'energy_vitality',
      revenueCatMaleVitalityEntitlementId:
        process.env.EXPO_PUBLIC_RC_MALE_VITALITY_ENTITLEMENT_ID ?? 'male_sexual_health',
      revenueCatSixDayProductIds: parseCsvEnv(
        process.env.EXPO_PUBLIC_RC_6_DAY_PRODUCT_IDS ?? DEFAULT_SIX_DAY_REVENUECAT_ID
      ),
      revenueCatNinetyDayProductIds: parseCsvEnv(
        process.env.EXPO_PUBLIC_RC_90_DAY_PRODUCT_IDS ?? DEFAULT_NINETY_DAY_REVENUECAT_ID
      ),
      revenueCatAgeReversalProductIds: parseCsvEnv(
        process.env.EXPO_PUBLIC_RC_AGE_REVERSAL_PRODUCT_IDS ?? 'age_reversal'
      ),
      revenueCatSleepResetProductIds: parseCsvEnv(
        process.env.EXPO_PUBLIC_RC_SLEEP_RESET_PRODUCT_IDS ?? 'sleep_disorder_reset'
      ),
      revenueCatEnergyVitalityProductIds: parseCsvEnv(
        process.env.EXPO_PUBLIC_RC_ENERGY_VITALITY_PRODUCT_IDS ?? 'energy_vitality'
      ),
      revenueCatMaleVitalityProductIds: parseCsvEnv(
        process.env.EXPO_PUBLIC_RC_MALE_VITALITY_PRODUCT_IDS ?? 'male_sexual_health'
      ),
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? null,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? null,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? null,
      easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? null,
      programAudioBucket: process.env.EXPO_PUBLIC_SUPABASE_PROGRAM_AUDIO_BUCKET ?? 'program-audio',
    },
    errorMessage:
      missingKeys.length > 0
        ? `Missing required environment variables: ${missingKeys.join(', ')}`
        : null,
    isValid: missingKeys.length === 0,
    missingRequiredKeys: missingKeys,
  };
}

export function getPublicEnvState(): PublicEnvState {
  if (!cachedPublicEnvState) {
    cachedPublicEnvState = buildPublicEnvState();
  }

  return cachedPublicEnvState;
}

export function getPublicEnv(): PublicEnv {
  return getPublicEnvState().env;
}

export function validatePublicEnv() {
  const publicEnvState = getPublicEnvState();

  if (!publicEnvState.isValid) {
    throw new Error(publicEnvState.errorMessage ?? 'Public environment is invalid.');
  }

  return publicEnvState.env;
}
