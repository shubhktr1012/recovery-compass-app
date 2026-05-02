# Environment Map

This repo currently has two effective environments:

- `local`
- `production`

There is not yet a true `staging` environment. The current `eas.json` profiles
`development`, `preview`, and `production` all point at the same live Supabase
project, the same RevenueCat app, and the same Google OAuth client set.

## Current state

### Local app runtime

Primary sources:

- `app/.env`
- `app/.env.local`

Runtime variables used by the Expo app:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- `EXPO_PUBLIC_SUPABASE_PROGRAM_AUDIO_BUCKET`
- `EXPO_PUBLIC_RC_6_DAY_ENTITLEMENT_ID`
- `EXPO_PUBLIC_RC_90_DAY_ENTITLEMENT_ID`
- `EXPO_PUBLIC_RC_AGE_REVERSAL_ENTITLEMENT_ID`
- `EXPO_PUBLIC_RC_SLEEP_RESET_ENTITLEMENT_ID`
- `EXPO_PUBLIC_RC_ENERGY_VITALITY_ENTITLEMENT_ID`
- `EXPO_PUBLIC_RC_MALE_VITALITY_ENTITLEMENT_ID`
- `EXPO_PUBLIC_RC_6_DAY_PRODUCT_IDS`
- `EXPO_PUBLIC_RC_90_DAY_PRODUCT_IDS`
- `EXPO_PUBLIC_RC_AGE_REVERSAL_PRODUCT_IDS`
- `EXPO_PUBLIC_RC_SLEEP_RESET_PRODUCT_IDS`
- `EXPO_PUBLIC_RC_ENERGY_VITALITY_PRODUCT_IDS`
- `EXPO_PUBLIC_RC_MALE_VITALITY_PRODUCT_IDS`

### Supabase Edge Functions

`supabase/functions/revenuecat-webhook` currently requires:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_AUTH`
- `APP_PURCHASE_EMAIL_ENDPOINT`
- `APP_PURCHASE_EMAIL_SECRET`
- `RC_6_DAY_ENTITLEMENT_ID`
- `RC_90_DAY_ENTITLEMENT_ID`
- `RC_SLEEP_RESET_ENTITLEMENT_ID`
- `RC_ENERGY_VITALITY_ENTITLEMENT_ID`
- `RC_AGE_REVERSAL_ENTITLEMENT_ID`
- `RC_MALE_VITALITY_ENTITLEMENT_ID`
- `RC_6_DAY_PRODUCT_IDS`
- `RC_90_DAY_PRODUCT_IDS`
- `RC_SLEEP_RESET_PRODUCT_IDS`
- `RC_ENERGY_VITALITY_PRODUCT_IDS`
- `RC_AGE_REVERSAL_PRODUCT_IDS`
- `RC_MALE_VITALITY_PRODUCT_IDS`

`supabase/functions/delete-account` currently requires:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### EAS build profiles

Current profiles:

- `development`
- `preview`
- `production`

Current problem:

- all three profiles are wired to the same live Supabase URL
- all three profiles use the same RevenueCat public keys
- all three profiles use the same Google OAuth client IDs

That means `preview` is not safe as a staging surrogate for purchases or auth.

## Target environment model

Use three environments:

1. `local`
2. `staging`
3. `production`

### Local

Purpose:

- day-to-day development
- simulator/device testing against either local mocks or staging services

Recommended backing services:

- Supabase local or staging
- RevenueCat staging or sandbox app
- non-production Google OAuth credentials

### Staging

Purpose:

- QA builds
- purchase flow testing
- webhook validation
- pre-release sign-in and onboarding checks

Must be isolated from production for:

- Supabase project
- RevenueCat app / entitlements / offerings
- Google OAuth clients
- App purchase email secret and endpoint
- RevenueCat webhook auth secret

### Production

Purpose:

- store builds
- live users
- live purchases and live webhook processing

## Required staging work

### App config

1. Create a staging Supabase project.
2. Apply app migrations to staging.
3. Seed the staging program catalog/content.
4. Create a staging RevenueCat app with matching product identifiers.
5. Create staging Google OAuth client IDs.
6. Add a distinct EAS profile or repurpose `preview` to point to staging.
7. Remove hardcoded live values from `eas.json` and move them to EAS env vars.

### Secrets and service wiring

Create staging values for:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_AUTH`
- `APP_PURCHASE_EMAIL_ENDPOINT`
- `APP_PURCHASE_EMAIL_SECRET`

### EAS structure recommendation

Recommended profiles:

- `development`: local/dev testing, development client
- `preview`: staging backend, internal APK/IPA
- `production`: production backend, store-ready builds

## Immediate cleanup still needed

These are the current concrete risks:

1. `eas.json` contains live public service values directly in versioned config.
2. `preview` is not isolated from production.
3. RevenueCat webhook docs previously implied only smoking identifiers mattered, but the webhook now reads all configured program identifiers.

## Next implementation step

When you are ready to actually create staging, do this in order:

1. Create staging Supabase.
2. Create staging RevenueCat.
3. Create staging Google OAuth clients.
4. Add staging secrets to EAS.
5. Repoint `preview` to staging.
6. Deploy Supabase functions to staging.
7. Send RevenueCat staging webhooks to staging.
8. Verify sign-in, purchase, restore, active-program switching, and app-purchase email dispatch on a staging build.
