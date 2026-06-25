# Recovery Compass App Agent Context

## Surface

This is the Expo React Native app for Recovery Compass. Use this folder for mobile app features, program delivery, onboarding, journaling, notifications, RevenueCat access, Supabase client work, and canonical content tooling.

## Stack

- Expo SDK, Expo Router, React Native, TypeScript, NativeWind, Supabase, RevenueCat, React Query, notifications, audio, secure storage, and canonical content scripts.
- Main scripts: `npm run start`, `npm run ios`, `npm run android`, `npm run lint`, `npm run lint:strict`, `npm run typecheck`, and the `canonical:*` scripts.

## Rules

- Preserve offline/fallback behavior when changing content delivery or program access.
- When touching program content, run the relevant canonical normalization/validation/QA scripts.
- When touching purchases or access rules, check RevenueCat entitlement assumptions, Supabase persistence, and local fallback behavior together.
- When touching Supabase functions or migrations, keep generated types and runtime callers aligned.
- Keep UI calm, premium, readable, and mobile-safe across loading, empty, error, and locked states.
