# Sprint Status — Recovery Compass

> Last updated: April 5, 2026
> Branch: `rebuild/multi-program`
> Questionnaire foundation: ready
> Sellable catalog: 6 products configured in RevenueCat, final INR pricing entered in App Store Connect, Play one-time products created
> Final content pending from Anjan: Sleep (21d), Energy (14d), Men's Health (30d) — durations refreshed in app

## Launch Blockers (must fix before ANY submission)

- [x] App icon from Anjan (1024x1024 PNG)
- [x] App Store Connect iOS IAP setup + final INR pricing entry
- [x] Google Play internal build uploaded + one-time products created
- [ ] Updated Sleep / Energy / Men's Health content signoff from Anjan
- [ ] Final QA sweep on questionnaire → paywall → purchase → program access

## Completed

- [x] V2 content types (10 card types, TypeScript interfaces)
- [x] Supabase content schema (programs + program_days tables)
- [x] All 6 programs seeded in Supabase (~2,478 cards, 292 days)
- [x] Supabase-backed hooks (usePrograms, useProgram, useDay)
- [x] Triple fallback: Supabase → TanStack cache → local static
- [x] Premium card renderer (10 card views, visual upgrade)
- [x] PagerView day-detail screen (swipe, tap, progress persistence)
- [x] Program tab routes unlocked days to V2 top-level day-detail
- [x] Skeleton, ErrorState, OfflineBanner components
- [x] Auth flow (sign up, sign in, forgot password)
- [x] Apple Sign-In configured end-to-end (Identifiers + Supabase provider + nonce handling)
- [x] Google Sign-In stabilized in Expo/Supabase (code exchange handled by provider hook, id_token sign-in flow fixed)
- [x] Existing-account auth UX hardened (manual vs OAuth conflict path routed safely)
- [x] One-time linked-account notice when adding Google/Apple to an existing account
- [x] Delete Account flow (Supabase Edge Function live, auth deletion + cascade cleanup verified)
- [x] Multi-program questionnaire foundation (quick profile, self-select vs guided path, persistence, recommendation routing)
- [x] Questionnaire UI first draft (premium mobile layout, clear progress, polished selection states)
- [x] Multi-program paywall foundation (program-targeted paywall handoff, duplicate-package fix, purchase/restore path verified)
- [x] RevenueCat 6-product catalog configured
- [x] Google Play merchant profile + internal testing release bootstrapped
- [x] Final program naming aligned across onboarding, paywall, and program screens
- [x] Duration refresh shipped for Energy (14d) and Men's Health (30d)
- [x] Profile with access status + restore purchases
- [x] SOS modal (basic breathing)
- [x] Content seed generator script
- [x] Root layout auth guard (hardened, multi-route support)
- [x] Test-cards route hidden from tab bar (`href: null` already configured)
- [x] Xcode + Android Studio installed and configured
- [x] Apple Developer account active
- [x] Premium card design reference HTML (V2)
- [x] Splash screen design direction established (V4 wellness)
- [x] Tab bar design with Ground center button (notched)
- [x] Privacy Policy / Terms links available in-app on auth welcome screen

## In Progress

- [ ] Questionnaire minor polish and edge-case cleanup
- [ ] Paywall visual polish / merchandising refinement
- [ ] Visual overhaul — apply V4 wellness design to all screens
- [ ] Ground feature (center tab, guided grounding experience)
- [ ] Store pricing sync: update 90-Day Biohacking Reset to INR 6,999 across all stores
- [ ] RevenueCat production offering cleanup / cross-platform offering strategy

## Not Started — Needed for Launch

- [ ] Tab bar redesign (5 tabs with Ground center button)
- [ ] Interactive breathing exercise card (animated circle)
- [ ] Audio card playback (wire expo-av)
- [ ] Program completion screen (celebration + upsell)
- [ ] Push notification permission (after Day 1)
- [ ] Store review prompt (after Day 3+)
- [ ] EAS production build (iOS)
- [ ] App Store Connect metadata + screenshots
- [ ] App Store Connect IAP review screenshots + notes for all 6 products

## Not Started — Can Ship After Launch

- [ ] Google Play production submission / review assets
- [ ] CALM/Ground full 10-min guided experience
- [ ] Sleep program content (waiting on Anjan — 21 days)
- [ ] Energy program content (waiting on Anjan — 14 days)
- [ ] Men's Health content (waiting on Anjan — 30 days)
- [ ] Journal visual polish
- [ ] Dashboard redesign for multi-program
- [ ] Sentry crash reporting
- [ ] Smart notifications engine

## Blocked On Anjan

- [ ] Splash screen assets
- [ ] Final store listing copy / screenshots signoff
- [ ] Sleep program new content (21 days)
- [ ] Energy program new content (14 days)
- [ ] Men's Health new content (30 days)

## Current App Flow (what the user sees today)

```
Launch → Splash (Expo default) → Sign In / Sign Up
→ Adaptive multi-program questionnaire
  Quick profile → self-select or guided path → branched questions
→ Recommendation screen (guided path only)
→ Program-targeted paywall (recommended program(s), 6-product catalog configured)
→ 4-tab layout: Home | Program | Journal | Profile
  Home: Dashboard with stats + today's focus card
  Program: Timeline with locked/unlocked days → V2 day-detail (PagerView)
  Journal: Mood + cravings + reflection form
  Profile: Stats, access status, restore, sign out
```

## Target App Flow (what we're building toward)

```
Launch → V4 Splash → Onboarding Carousel → Sign Up / Sign In
→ Multi-program Questionnaire (branched by concern)
→ Program Recommendation → Multi-program Paywall
→ 5-tab layout: Home | Program | [Ground] | Routine | Profile
  Home: Multi-program dashboard
  Program: Active program timeline → V2 day-detail (PagerView swipe)
  Ground: Guided grounding experience (center elevated button)
  Routine: Daily routine + journal
  Profile: Multi-program access, settings, delete account
```

## Known Bugs

- [ ] program_access read path uses .maybeSingle() (breaks with multiple programs)
- [ ] 90-Day Smoking Reset missing 2 days in Supabase (days 88-90 gap)
