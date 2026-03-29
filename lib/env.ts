import {
  DEFAULT_NINETY_DAY_REVENUECAT_ID,
  DEFAULT_SIX_DAY_REVENUECAT_ID,
} from '@/lib/revenuecat/identifiers';

const requiredPublicEnvKeys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
] as const;

function parseCsvEnv(value: string | null | undefined) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function validatePublicEnv() {
  const missingKeys = requiredPublicEnvKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  return {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL as string,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
    revenueCatAppleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? null,
    revenueCatGoogleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? null,
    revenueCatSixDayEntitlementId: process.env.EXPO_PUBLIC_RC_6_DAY_ENTITLEMENT_ID ?? DEFAULT_SIX_DAY_REVENUECAT_ID,
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
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? null,
    programAudioBucket: process.env.EXPO_PUBLIC_SUPABASE_PROGRAM_AUDIO_BUCKET ?? 'program-audio',
  };
}
