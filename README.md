# Recovery Compass App

Recovery Compass App is the Expo / React Native product for guided recovery programs. The current build includes authentication, adaptive onboarding, program recommendations, RevenueCat paywalls, Supabase-backed content delivery, Free Detox access, journaling, profile/account management, local reminders, and the first Expo Push Service foundation.

## Status snapshot

Current repo state as of June 14, 2026:

- Multi-program onboarding is live.
- Six active paid programs are configured in RevenueCat.
- Legacy `six_day_reset` and `ninety_day_transform` are retained for historical access/restore compatibility, but hidden from the public catalog.
- `free_detox_reset` is an app-only free program and bonus program, not a paid catalog product.
- Program content is read from Supabase first, then the persisted TanStack Query cache, then local fallback content where available.
- The shipped in-app flow today is `sign in/sign up -> questionnaire -> recommendation -> paywall/free tier -> Home | Program | Journal | Profile`.
- Paid daily reminders remain local scheduled notifications. Expo Push Service is now added for token tracking, admin/test sends, receipts, and high-value server push events.
- Launch blockers and day-to-day progress live in [`docs/SPRINT_STATUS.md`](docs/SPRINT_STATUS.md).

## Program catalog

| Program | Slug | Days | Current state |
| --- | --- | ---: | --- |
| Smoking & Alcohol Quit Program | `smoking_alcohol_quit` | 21 | Active paid catalog program |
| Gut Reset Program | `gut_health_reset` | 21 | Active paid catalog program |
| Deep Sleep Reset Program | `sleep_disorder_reset` | 21 | Active paid catalog program |
| Energy Restore Program | `energy_vitality` | 14 | Active paid catalog program |
| Men’s Vitality Reset Program | `male_sexual_health` | 30 | Active paid catalog program |
| Age Reversal Program | `age_reversal` | 90 | Active paid catalog program |
| Free Detox Program | `free_detox_reset` | 6 | Free app-only program and paid-program bonus |
| Control | `six_day_reset` | 6 | Legacy/replaced; keep for restore/history only |
| Smoking Reset | `ninety_day_transform` | 90 | Legacy/replaced; keep for restore/history only |

## Stack

- Expo 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- NativeWind / Tailwind CSS
- Supabase
- TanStack Query with async-storage persistence
- RevenueCat
- Expo Notifications, Audio, Blur, Secure Store, and EAS Build

## What is in this repo

```text
app/
├── app/                  Expo Router routes
├── components/           Screen and UI components
├── content/              Local fallback program content
├── docs/                 Sprint status and product specs
├── hooks/                Content, onboarding, and device hooks
├── lib/                  Environment, onboarding, storage, and service logic
├── providers/            Auth, profile, and query providers
├── scripts/              Content generation helpers
├── supabase/             Migrations, seeds, and Edge Functions
└── ios/                  Native iOS project
```

Important docs:

- [`docs/SPRINT_STATUS.md`](docs/SPRINT_STATUS.md)
- [`docs/ENVIRONMENTS.md`](docs/ENVIRONMENTS.md)
- `docs/plans/` for implementation and design notes

## Local development

### Prerequisites

- Node.js 20+
- npm
- Xcode for iOS work
- Android Studio for Android work
- A Supabase project
- RevenueCat project keys for the products you want to test

### Install

```bash
npm install
```

### Environment variables

Create `app/.env` before launching the app. At minimum, the current app expects:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_REVENUECAT_APPLE_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=

EXPO_PUBLIC_RC_6_DAY_ENTITLEMENT_ID=six_day_control
EXPO_PUBLIC_RC_90_DAY_ENTITLEMENT_ID=ninety_day_quit
EXPO_PUBLIC_RC_SMOKING_ALCOHOL_QUIT_ENTITLEMENT_ID=smoking_alcohol_quit
EXPO_PUBLIC_RC_AGE_REVERSAL_ENTITLEMENT_ID=age_reversal
EXPO_PUBLIC_RC_SLEEP_RESET_ENTITLEMENT_ID=sleep_disorder_reset
EXPO_PUBLIC_RC_ENERGY_VITALITY_ENTITLEMENT_ID=energy_vitality
EXPO_PUBLIC_RC_MALE_VITALITY_ENTITLEMENT_ID=male_sexual_health
EXPO_PUBLIC_RC_GUT_HEALTH_RESET_ENTITLEMENT_ID=gut_health_reset

EXPO_PUBLIC_RC_6_DAY_PRODUCT_IDS=six_day_control
EXPO_PUBLIC_RC_90_DAY_PRODUCT_IDS=ninety_day_quit
EXPO_PUBLIC_RC_SMOKING_ALCOHOL_QUIT_PRODUCT_IDS=smoking_alcohol_quit
EXPO_PUBLIC_RC_AGE_REVERSAL_PRODUCT_IDS=age_reversal
EXPO_PUBLIC_RC_SLEEP_RESET_PRODUCT_IDS=sleep_disorder_reset
EXPO_PUBLIC_RC_ENERGY_VITALITY_PRODUCT_IDS=energy_vitality
EXPO_PUBLIC_RC_MALE_VITALITY_PRODUCT_IDS=male_sexual_health
EXPO_PUBLIC_RC_GUT_HEALTH_RESET_PRODUCT_IDS=gut_health_reset

EXPO_PUBLIC_SUPABASE_PROGRAM_AUDIO_BUCKET=program-audio
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_RECOVERY_COMPASS_WEB_URL=https://recoverycompass.co
EXPO_PUBLIC_ENABLE_APP_WEB_HANDOFF=false
```

Notes:

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are required at runtime.
- `app/.env.example` now includes the full public multi-program key set.
- Keep RevenueCat lookup keys/product IDs stable even when display names change.
- `six_day_control` and `ninety_day_quit` remain legacy RevenueCat identifiers for historical compatibility.
- Use `main_production` as the only canonical RevenueCat offering. Keep legacy offerings archived; see [`docs/revenuecat-offerings-runbook.md`](docs/revenuecat-offerings-runbook.md).
- `EXPO_PUBLIC_EAS_PROJECT_ID` is optional locally, but required if you want EAS config to resolve cleanly from environment.
- `EXPO_PUBLIC_ENABLE_APP_WEB_HANDOFF=true` enables app-to-website login handoff for allowed web flows after the website/backend handoff routes are deployed.
- Android Google sign-in setup notes live in [`docs/android-google-signin.md`](docs/android-google-signin.md).

### Run the app

```bash
npm run start
```

Useful variants:

```bash
npm run ios
npm run android
npm run web
```

## Supabase setup

This repo expects the app database schema from `app/supabase/migrations` plus the seeded program content in `app/supabase/seeds`.

Relevant areas:

- `supabase/migrations/20260321130000_multi_program_content.sql` creates the multi-program catalog and access model.
- `supabase/seeds/*.sql` contains seeded day content for all six programs.
- `supabase/functions/delete-account` handles permanent account deletion.
- `supabase/functions/revenuecat-webhook` is the server-side RevenueCat sync path.
- `supabase/functions/register-push-token` upserts authenticated app-device Expo push tokens.
- `supabase/functions/send-push-notification` sends admin-token-protected Expo Push Service events and logs tickets.
- `supabase/functions/check-push-receipts` checks Expo push receipts and disables stale device tokens.

Important deploy note:

- `supabase/functions/revenuecat-webhook` uses a raw shared secret in the `Authorization` header, not a Supabase JWT.
- Always deploy it with `--no-verify-jwt`.
- Use `npm run supabase:functions:deploy:revenuecat-webhook` or `npm run supabase:functions:deploy:commerce`.
- Do not use a plain `supabase functions deploy revenuecat-webhook` command, or RevenueCat deliveries will start failing with `401 Invalid JWT`.

If you are wiring the webhook flow, you will also need server-side variables such as:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PUSH_FUNCTION_ADMIN_TOKEN=
REVENUECAT_WEBHOOK_AUTH=

RC_6_DAY_ENTITLEMENT_ID=six_day_control
RC_90_DAY_ENTITLEMENT_ID=ninety_day_quit
RC_6_DAY_PRODUCT_IDS=six_day_control
RC_90_DAY_PRODUCT_IDS=ninety_day_quit
```

RevenueCat webhook and purchase verification functions should continue using stable lookup keys/product IDs; display-name changes must not change store identifiers.

### Expo Push Service foundation

The app now uses a hybrid notification model:

- Paid daily program reminders remain local scheduled notifications.
- Free Detox local reminders are scheduled only when the user has activated free tier, has notifications enabled, and owns no paid program.
- Server push is available for high-value events and debugging through Expo Push Service.
- Server push event types in v1 are `admin_test_push`, `diet_plan_ready`, `free_detox_daily_fallback`, and `program_reengagement_fallback`.
- Every server push must use an idempotent `eventKey`, for example `admin_test:<user-id>:<timestamp>` or `free_detox:<user-id>:day-2:2026-06-14:fallback`.
- `profiles.expo_push_token` is still written temporarily for backward compatibility, but `push_device_tokens` is the long-term source of truth.

Push schema deploy:

```bash
supabase db push --linked --include-all
```

Push function deploy:

```bash
supabase functions deploy register-push-token --use-api --import-map ./supabase/functions/deno.json --workdir .
supabase functions deploy send-push-notification --use-api --import-map ./supabase/functions/deno.json --workdir .
supabase functions deploy check-push-receipts --use-api --import-map ./supabase/functions/deno.json --workdir .
```

Push function auth secret:

```bash
supabase secrets set --project-ref <project-ref> PUSH_FUNCTION_ADMIN_TOKEN="<long-random-secret>"
```

Notes:

- `PUSH_FUNCTION_ADMIN_TOKEN` is the preferred bearer secret for manual/admin push operations.
- `SUPABASE_SERVICE_ROLE_KEY` remains the internal database credential for the function runtime.
- Do not depend on `SUPABASE_SERVICE_ROLE_KEY` as the caller bearer token for day-to-day QA or admin tooling.

Manual admin test push:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-push-notification" \
  -H "Authorization: Bearer $PUSH_FUNCTION_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<auth-user-id>",
    "eventKey": "admin_test:<auth-user-id>:<unique-run-id>",
    "eventType": "admin_test_push",
    "title": "Recovery Compass test",
    "body": "This is a server push test.",
    "data": { "source": "manual-qa" }
  }'
```

Receipt check, after waiting at least 15 minutes:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/check-push-receipts" \
  -H "Authorization: Bearer $PUSH_FUNCTION_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "limit": 100 }'
```

Useful database checks:

```bash
supabase db query "select user_id::text, platform, app_version, last_seen_at, is_disabled from public.push_device_tokens order by last_seen_at desc limit 10;" --linked --output table
supabase db query "select event_type, ticket_status, receipt_status, sent_at, receipt_checked_at from public.push_notification_deliveries order by created_at desc limit 10;" --linked --output table
```

## Commands

```bash
npm run start
npm run ios
npm run android
npm run web
npm run lint
npm run lint:strict
npm run typecheck
npm run generate:program-content
npm run supabase:functions:list
npm run supabase:functions:deploy:delete-account
npm run supabase:functions:deploy:revenuecat-webhook
npm run supabase:functions:deploy:commerce
supabase functions deploy register-push-token --use-api --import-map ./supabase/functions/deno.json --workdir .
supabase functions deploy send-push-notification --use-api --import-map ./supabase/functions/deno.json --workdir .
supabase functions deploy check-push-receipts --use-api --import-map ./supabase/functions/deno.json --workdir .
```

## Android release notes

- Production EAS builds now retain Android `mapping.txt` through `buildArtifactPaths` in [eas.json](/Users/shubh/Development/recovery-compass/app/eas.json).
- Upload that mapping file to Play Console if you want deobfuscated Android crash and ANR reports for release builds.

## Current architecture notes

- Auth is handled through Supabase.
- Purchase state is managed on-device via RevenueCat and mirrored into profile/access state.
- Content fetching uses a three-layer fallback: Supabase -> TanStack Query cache -> local static content.
- Notification scheduling is hybrid: local scheduled reminders for program-day nudges, Expo Push Service for device-token observability, admin tests, receipts, and high-value server events.
- The current tab shell is still four tabs. The five-tab "Ground" layout is planned but not shipped yet.

## Known launch blockers

The current blockers before store submission are tracked in [`docs/SPRINT_STATUS.md`](docs/SPRINT_STATUS.md). Historically this list included:

- final app icon / splash assets
- final public pricing for all six programs
- refreshed content for Sleep, Energy, and Male Sexual Health
- full QA pass across questionnaire, paywall, purchase, and program unlock flow

For the live checklist, use [`docs/SPRINT_STATUS.md`](docs/SPRINT_STATUS.md).
