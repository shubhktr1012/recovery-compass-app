# Sprint Status — Recovery Compass

> Last updated: March 28, 2026
> Branch: `rebuild/multi-program`
> Launch programs: 6-Day Reset, 90-Day Quit, Age Reversal (3 of 6)
> Deferred programs: Sleep (21d), Energy (14d), Men's Health (30d) — waiting on Anjan's updated content

## Launch Blockers (must fix before ANY submission)

- [ ] Fix program tab → route day taps to V2 day-detail instead of V1
- [ ] Remove test-cards from tab bar
- [ ] App icon from Anjan (1024x1024 PNG)
- [ ] Multi-program questionnaire (copy received, needs implementation)
- [ ] Multi-program paywall (show 3 launch programs with pricing)
- [ ] Supabase sync error fix ✅ DONE (onConflict updated)

## Completed

- [x] V2 content types (10 card types, TypeScript interfaces)
- [x] Supabase content schema (programs + program_days tables)
- [x] All 6 programs seeded in Supabase (~2,478 cards, 292 days)
- [x] Supabase-backed hooks (usePrograms, useProgram, useDay)
- [x] Triple fallback: Supabase → TanStack cache → local static
- [x] Premium card renderer (10 card views, visual upgrade)
- [x] PagerView day-detail screen (swipe, tap, progress persistence)
- [x] Skeleton, ErrorState, OfflineBanner components
- [x] Auth flow (sign up, sign in, forgot password)
- [x] Delete Account flow (Supabase Edge Function live, auth deletion + cascade cleanup verified)
- [x] Profile with access status + restore purchases
- [x] SOS modal (basic breathing)
- [x] Content seed generator script
- [x] Root layout auth guard (hardened, multi-route support)
- [x] Xcode + Android Studio installed and configured
- [x] Apple Developer account active
- [x] Premium card design reference HTML (V2)
- [x] Splash screen design direction established (V4 wellness)
- [x] Tab bar design with Ground center button (notched)

## In Progress

- [ ] Visual overhaul — apply V4 wellness design to all screens
- [ ] Questionnaire implementation (copy from Anjan received)
- [ ] Ground feature (center tab, guided grounding experience)

## Not Started — Needed for Launch

- [ ] Multi-program paywall UI
- [ ] RevenueCat 6 products (currently only 2 configured)
- [ ] Tab bar redesign (5 tabs with Ground center button)
- [ ] Interactive breathing exercise card (animated circle)
- [ ] Audio card playback (wire expo-av)
- [ ] Program completion screen (celebration + upsell)
- [ ] Push notification permission (after Day 1)
- [ ] Store review prompt (after Day 3+)
- [ ] EAS production build (iOS)
- [ ] App Store Connect metadata + screenshots
- [ ] Privacy Policy link in-app (URL exists, needs in-app link)

## Not Started — Can Ship After Launch

- [ ] Google Play submission (account pending)
- [ ] CALM/Ground full 10-min guided experience
- [ ] Sleep program content (waiting on Anjan — 21 days)
- [ ] Energy program content (waiting on Anjan — 14 days)
- [ ] Men's Health content (waiting on Anjan — 30 days)
- [ ] Journal visual polish
- [ ] Dashboard redesign for multi-program
- [ ] Sentry crash reporting
- [ ] Smart notifications engine

## Blocked On Anjan

- [ ] App icon + splash screen assets
- [ ] Pricing for all 6 programs
- [ ] Sleep program new content (21 days)
- [ ] Energy program new content (14 days)
- [ ] Men's Health new content (30 days)

## Current App Flow (what the user sees today)

```
Launch → Splash (Expo default) → Sign In / Sign Up
→ V1 Personalization (smoking-specific) → V1 Paywall (2 products)
→ 4-tab layout: Home | Program | Journal | Profile
  Home: Dashboard with stats + today's focus card
  Program: Timeline with locked/unlocked days → V1 day-detail (scroll)
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

- [ ] V1 personalization is smoking-specific (needs replacement)
- [ ] V1 paywall only shows 2 products (needs replacement)
- [ ] Program tab routes to V1 day-detail (needs V2 swap)
- [ ] Dashboard shows "Recovery Warrior" (smoking-specific language)
- [ ] Dashboard shows ₹0 projection (smoking-specific)
- [ ] Profile shows "Not set" for all questionnaire fields
- [ ] program_access read path uses .maybeSingle() (breaks with multiple programs)
- [ ] 90-Day Quit missing 2 days in Supabase (days 88-90 gap)
