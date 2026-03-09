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
    revenueCatSixDayEntitlementId: process.env.EXPO_PUBLIC_RC_6_DAY_ENTITLEMENT_ID ?? '6_day_reset',
    revenueCatNinetyDayEntitlementId: process.env.EXPO_PUBLIC_RC_90_DAY_ENTITLEMENT_ID ?? '90_day_transform',
    revenueCatSixDayProductIds: parseCsvEnv(process.env.EXPO_PUBLIC_RC_6_DAY_PRODUCT_IDS ?? '6_day_reset'),
    revenueCatNinetyDayProductIds: parseCsvEnv(process.env.EXPO_PUBLIC_RC_90_DAY_PRODUCT_IDS ?? '90_day_transform'),
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? null,
    programAudioBucket: process.env.EXPO_PUBLIC_SUPABASE_PROGRAM_AUDIO_BUCKET ?? 'program-audio',
  };
}
