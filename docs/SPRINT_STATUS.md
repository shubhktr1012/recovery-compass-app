# Sprint Status — Recovery Compass

> Last updated: April 11, 2026
> Branch: `rebuild/multi-program`
> Questionnaire foundation: ready
> Sellable catalog: 6 products configured in RevenueCat, final INR pricing entered in App Store Connect and Google Play, unified `main_production` offering live
> Final content files received for Sleep, Energy, and Men's Health — live in Supabase, metadata aligned, Sleep cleanup refresh shipped, redesigned day-detail/card pass now underway

## Launch Blockers (must fix before ANY submission)

- [x] App icon from Anjan (1024x1024 PNG)
- [x] App Store Connect iOS IAP setup + final INR pricing entry
- [x] Google Play internal build uploaded + one-time products created
- [x] App Store Connect / Google Play compliance forms completed (metadata, legal, DSA, health, data safety, app access, deletion URL)
- [ ] Final QA sweep on Sleep / Energy / Men's Health program presentation in app
- [x] Final QA sweep on questionnaire → paywall → purchase → program access
- [ ] App Store submission package complete (screenshots and IAP review assets still pending)
- [ ] Android closed testing release published and 12-tester / 14-day clock started

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
- [x] RevenueCat production offering unified across iOS + Android (`main_production` current)
- [x] RevenueCat iOS SDK/app credentials configured (App Store Connect API + In-App Purchase key)
- [x] Google Play merchant profile + internal testing release bootstrapped
- [x] Final program naming aligned across onboarding, paywall, and program screens
- [x] Duration refresh shipped for Energy (14d) and Men's Health (30d)
- [x] iOS StoreKit simulator purchase flow verified end-to-end (offering fetch, purchase, receipt post, unlock path)
- [x] Biohacking price updated to INR 6,999 in App Store Connect and Google Play
- [x] Profile with access status + restore purchases
- [x] SOS modal (basic breathing)
- [x] Content seed generator script
- [x] Root layout auth guard (hardened, multi-route support)
- [x] Account redesign — identity-first Account tab, nested settings/statistics stack
- [x] Profile picture upload (gallery only) + edit-profile bottom sheet
- [x] Statistics page + featured stat card preview on Account screen
- [x] Clean Account/auth/profile stabilization commit created (`9fe2751`)
- [x] 90-Day Smoking Reset content refresh applied live (clean cards re-seeded)
- [x] Sleep content refresh applied live for Days 2, 14, and 18
- [x] Test-cards route hidden from tab bar (`href: null` already configured)
- [x] Xcode + Android Studio installed and configured
- [x] Apple Developer account active
- [x] Premium card design reference HTML (V2)
- [x] Splash screen design direction established (V4 wellness)
- [x] Submission-safe 4-tab bar redesign shipped (dark forest, safe-area hardened, hidden test route preserved)
- [x] Privacy Policy / Terms links available in-app on auth welcome screen
- [x] Auth / first-run visual polish pass shipped (welcome/auth surfaces refreshed, onboarding routes preserved)
- [x] Account / settings / statistics visual polish pass shipped
- [x] Day-detail shell refreshed (editorial header, story-style progress rail, resume continuity, card handoff plumbing)
- [x] Program reflection persistence foundation added (Supabase table + native API wiring)
- [x] Day completion flow shipped (calendar-based unlock cadence, in-card close/completion UX, Supabase sync restored)
- [x] Smoking onboarding baseline now captures both daily count and daily spend, with program-aware statistics wiring added for all journeys

## In Progress

- [ ] Questionnaire minor polish and edge-case cleanup
- [ ] Paywall visual polish / merchandising refinement
- [ ] Program tab hierarchy and timeline refinement
- [ ] Visual overhaul — apply V4 wellness design to all screens
- [ ] Program day/content-card overhaul (routine/audio/journal/editorial consistency)
- [ ] Tab bar redesign — future 5-tab architecture (`Home | Program | Ground | Journal/Routines | Account`)
- [ ] Journal + Routines redesign (shared surface, segmented Today/Journal model)
- [ ] Dashboard redesign planning (All Programs / My Programs + slim feature previews)
- [ ] Overall card/frontend overhaul
- [ ] Website skeleton system via Boneyard
- [ ] App skeleton system — native equivalent matching the Boneyard visual language
- [ ] Ground feature (center tab, guided grounding experience)
- [ ] Device QA on real iPhone test track
- [ ] Android real-device QA for Account avatar upload flow
- [ ] Account submission-safe polish pass
- [ ] Final real-device QA on redesigned tab bar + day-detail cards

## Not Started — Needed for Launch

- [ ] Tab bar redesign (5 tabs with Ground center button)
- [ ] Interactive breathing exercise card (animated circle)
- [ ] Audio card playback (wire expo-av)
- [ ] Program completion screen (celebration + upsell)
- [ ] Push notification permission (after Day 1)
- [ ] Store review prompt (after Day 3+)
- [ ] EAS production build (iOS)
- [ ] Google Play closed testing release (AAB) + tester onboarding
- [ ] App Store Connect screenshots + IAP review assets
- [ ] Generate final store listing screenshots
- [ ] App Store Connect IAP review screenshots + notes for all 6 products
- [ ] Google Play tablet screenshots / listing assets

## Not Started — Can Ship After Launch

- [ ] Google Play production submission / review assets
- [ ] Avatar upload hardening: normalize uploads to one output format
- [ ] Avatar upload hardening: enforce max image dimensions / file size
- [ ] Avatar upload hardening: clean up old avatar objects when extension changes
- [ ] Avatar upload hardening: migrate off `expo-file-system/legacy` to the new `File` API
- [ ] CALM/Ground full 10-min guided experience
- [ ] Mentor routine system v1 (structured template library + rare custom one-off routines)
- [ ] Day-in-program routine schema redesign (program/day-focused rather than generic task-focused)
- [ ] Program progress sync hardening follow-up: replace launch-safe delete+insert sync with an atomic server-side or RLS-clean upsert path for stronger same-user multi-device concurrency
- [ ] Calendar sync for mentor-assigned routines (Google / Apple Calendar integration)
- [ ] Mentor workflow streamlining (structured input flow instead of free-text routine entry)
- [ ] Sentry crash reporting
- [ ] Smart notifications engine

## Blocked On Anjan

- [ ] No current blockers from Anjan

## Current App Flow (what the user sees today)

```
Launch → White splash with primary logo → Sign In / Sign Up
→ Adaptive multi-program questionnaire
  Quick profile → self-select or guided path → branched questions
→ Recommendation screen (guided path only)
→ Program-targeted paywall (recommended program(s), unified cross-platform catalog configured)
→ 4-tab layout: Home | Program | My Journal | Account
  Home: Dashboard with stats + today's focus card
  Program: Timeline with locked/unlocked days → V2 day-detail (PagerView)
  My Journal: Mood + cravings + reflection form
  Account: Identity-first profile, featured stat card, Edit Profile, Settings, Statistics
```

## Target App Flow (what we're building toward)

```
Launch → V4 Splash → Onboarding Carousel → Sign Up / Sign In
→ Multi-program Questionnaire (branched by concern)
→ Program Recommendation → Multi-program Paywall
→ 5-tab layout: Home | Program | [Ground] | Journal/Routines | Account
  Home: Multi-program dashboard
  Program: Active program timeline → V2 day-detail (PagerView swipe)
  Ground: Guided grounding experience (center elevated button)
  Journal/Routines: Shared surface with segmented Today + Journal experience, anchored around day-in-program guidance and routines
  Account: Identity-first profile → Edit Profile bottom sheet → Settings / Statistics inside account stack
```

## Known Bugs

- [ ] iOS purchase environment still noisy unless tested via Xcode StoreKit config or real-device sandbox
- [ ] RevenueCat / App Store Connect production purchase path still blocked by `MISSING_METADATA` on all 6 iOS IAP products and noisy unused offerings (`default`, `main`, `main_android`)

## Latest Verification

- [x] iOS simulator fetches `main_production` correctly when launched from Xcode with local `.storekit`
- [x] StoreKit local purchase for `ninety_day_quit` posts receipt to RevenueCat successfully
- [x] Paywall purchase flow now waits for confirmed unlock before routing to Program tab
- [x] StoreKit transaction reset + smoking purchase QA confirms `six_day_control` and `ninety_day_quit` unlock independently
- [x] Post-reopen active program and restore flow stay correct after smoking purchase
- [x] iOS native Account QA verified: edit name, clear name, settings, statistics, avatar upload
- [x] 90-Day Smoking Reset live content refresh spot-checked clean at Days 1, 7, 45, and 90
- [x] Sleep live content refresh applied for Days 2, 14, and 18; Day 14 in-app spot-check looks good
- [x] Energy program in-app QA passed
- [x] Men's Health program content refresh applied live and day view now reflects the DB-backed content correctly
- [x] Questionnaire → recommendation → paywall → purchase → unlock sweep passed on iOS
- [x] iOS auth QA passed for email, Google, and Apple sign-in
- [x] Startup stale-session recovery verified end-to-end with forced invalid refresh-token state; app returns to Welcome and shows the session-expired notice
- [x] Day completion now persists without the prior `program_progress` constraint/RLS runtime error; current launch-safe sync strategy is acceptable for launch volume, with stronger concurrency hardening deferred post-review
- [ ] Real-device iPhone sandbox purchase verification still pending (borrowed device / TestFlight)
- [x] Android internal-track Google Play purchase verification complete (Play install, tester account, Google Play purchase success, unlock path, restore path)
- [x] Redesigned 4-tab bar routes verified on device (Home / Program / My Journal / Account)
- [x] Redesigned 4-tab bar shows no clipping near the home indicator on device
- [ ] Redesigned 4-tab bar keyboard-hide behavior still needs explicit on-device confirmation
- [x] Apple Store Connect + Google Play compliance forms filled out; remaining store work is now screenshot and submission packaging only
