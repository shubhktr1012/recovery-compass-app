# Recovery Compass App

Recovery Compass App is the Expo / React Native product for guided recovery programs. The current build includes authentication, adaptive onboarding, program recommendations, RevenueCat paywalls, Supabase-backed content delivery, journaling, and profile/account management.

## Status snapshot

Current repo state as of March 29, 2026:

- Multi-program onboarding is live.
- Six products are configured in RevenueCat.
- Program content is read from Supabase first, then the persisted TanStack Query cache, then local fallback content where available.
- The shipped in-app flow today is `sign in/sign up -> questionnaire -> recommendation -> paywall -> Home | Program | Journal | Profile`.
- Launch blockers and day-to-day progress live in [`docs/SPRINT_STATUS.md`](docs/SPRINT_STATUS.md).

## Program catalog

| Program | Slug | Days | Current state |
| --- | --- | ---: | --- |
| 6-Day Control | `six_day_reset` | 6 | Available in app, local fallback content present |
| 90-Day Quit Smoking | `ninety_day_transform` | 90 | Available in app, local fallback content present |
| Sleep Disorder Reset | `sleep_disorder_reset` | 21 | Seeded in Supabase, final content/pricing still pending |
| Energy & Vitality | `energy_vitality` | 42 | Seeded in Supabase, final content/pricing still pending |
| Age Reversal | `age_reversal` | 90 | Seeded in Supabase, pricing still pending |
| Male Sexual Health | `male_sexual_health` | 45 | Seeded in Supabase, final content/pricing still pending |

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
EXPO_PUBLIC_RC_AGE_REVERSAL_ENTITLEMENT_ID=age_reversal
EXPO_PUBLIC_RC_SLEEP_RESET_ENTITLEMENT_ID=sleep_disorder_reset
EXPO_PUBLIC_RC_ENERGY_VITALITY_ENTITLEMENT_ID=energy_vitality
EXPO_PUBLIC_RC_MALE_VITALITY_ENTITLEMENT_ID=male_sexual_health

EXPO_PUBLIC_RC_6_DAY_PRODUCT_IDS=six_day_control
EXPO_PUBLIC_RC_90_DAY_PRODUCT_IDS=ninety_day_quit
EXPO_PUBLIC_RC_AGE_REVERSAL_PRODUCT_IDS=age_reversal
EXPO_PUBLIC_RC_SLEEP_RESET_PRODUCT_IDS=sleep_disorder_reset
EXPO_PUBLIC_RC_ENERGY_VITALITY_PRODUCT_IDS=energy_vitality
EXPO_PUBLIC_RC_MALE_VITALITY_PRODUCT_IDS=male_sexual_health

EXPO_PUBLIC_SUPABASE_PROGRAM_AUDIO_BUCKET=program-audio
EXPO_PUBLIC_EAS_PROJECT_ID=
```

Notes:

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are required at runtime.
- `app/.env.example` now includes the full public multi-program key set.
- Use `six_day_control` and `ninety_day_quit` as the canonical smoking RevenueCat identifiers across app and webhook config.
- `EXPO_PUBLIC_EAS_PROJECT_ID` is optional locally, but required if you want EAS config to resolve cleanly from environment.
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

If you are wiring the webhook flow, you will also need server-side variables such as:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
REVENUECAT_WEBHOOK_AUTH=

RC_6_DAY_ENTITLEMENT_ID=six_day_control
RC_90_DAY_ENTITLEMENT_ID=ninety_day_quit
RC_6_DAY_PRODUCT_IDS=six_day_control
RC_90_DAY_PRODUCT_IDS=ninety_day_quit
```

The current webhook implementation only reads the smoking product identifiers above.

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
```

## Android release notes

- Production EAS builds now retain Android `mapping.txt` through `buildArtifactPaths` in [eas.json](/Users/shubh/Development/recovery-compass/app/eas.json).
- Upload that mapping file to Play Console if you want deobfuscated Android crash and ANR reports for release builds.

## Current architecture notes

- Auth is handled through Supabase.
- Purchase state is managed on-device via RevenueCat and mirrored into profile/access state.
- Content fetching uses a three-layer fallback: Supabase -> TanStack Query cache -> local static content.
- The current tab shell is still four tabs. The five-tab "Ground" layout is planned but not shipped yet.

## Known launch blockers

The current blockers before store submission are:

- final app icon / splash assets
- final public pricing for all six programs
- refreshed content for Sleep, Energy, and Male Sexual Health
- full QA pass across questionnaire, paywall, purchase, and program unlock flow

For the live checklist, use [`docs/SPRINT_STATUS.md`](docs/SPRINT_STATUS.md).
