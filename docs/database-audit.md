# Database Audit

Last updated: 2026-04-18

This is the current-state audit for the profile and entitlement data model.
It keeps only the useful facts that still matter after the cleanup work.

## Current Shape

### `profiles`

What it owns now:
- identity and contact info
- onboarding state
- questionnaire answers
- push notification preferences
- the optional `revenuecat_app_user_id` bridge
- recommendation metadata used by the app

What it no longer owns:
- entitlement truth
- active program truth
- subscription tier/status truth
- legacy questionnaire completion mirrors
- quiet-hours preference fields

Current keep list:
- `id`
- `email`
- `created_at`
- `updated_at`
- `display_name`
- `avatar_url`
- `expo_push_token`
- `push_opt_in`
- `timezone`
- `onboarding_complete`
- `questionnaire_answers`
- `recommended_program`
- `onboarding_completed_at`
- `revenuecat_app_user_id` as a bridge only

### `program_access`

This is the canonical entitlement table.
It now owns program ownership and lifecycle state.

Current role:
- source of truth for owned programs
- source of truth for access state
- destination for RevenueCat webhook writes

### `questionnaire_runs`

This is the append-only questionnaire history layer.

Current role:
- long-term record of completed questionnaire runs
- branch-safe history for future analytics and support
- write target for completed onboarding and realignment flows

What it is not:
- the live questionnaire state store
- the source of truth for what the app should render right now

Current shape:
- user_id
- source
- questionnaire_version
- journey_key
- recommended_program
- primary_concern_label
- questionnaire_answers
- timestamps for run completion/history

### `onboarding_responses`

This is now a legacy compatibility summary table.

Current role:
- legacy summary write target during onboarding completion
- read source for a few existing dashboard/profile/statistics surfaces
- historical bridge for older questionnaire rows that predate `questionnaire_runs`

What it is not:
- the canonical live questionnaire model
- the best long-term branch-safe history layer

Current dependency note:
- do not drop it yet
- several app surfaces still read it through `useOnboardingResponse()`
- it should be frozen and migrated away from gradually, not removed abruptly

### `program_reflections`

This is the guided in-program reflection table.

Current role:
- stores prompt-scoped answers for program day reflection cards
- restores saved reflections when a user revisits a specific day card
- supports a future read-only `Reflections` archive without merging into the daily journal

What it is not:
- the general daily journal
- a replacement for `journal_entries`

Current dependency note:
- keep it separate from `journal_entries`
- it represents structured, prompt-bound writing rather than freeform daily check-ins

### `user_routines` and `routine_checkins`

These are dormant routine-tracking tables, not active launch systems.

Current role:
- placeholder infrastructure for future routine assignment and daily check-ins
- supports the idea of user-owned routines plus one check-in per routine per day
- cleaned up correctly during account deletion

What they are not:
- a finished mentor-assigned routine system
- a day-in-program routine model
- an active launch feature in the current app UX

Current dependency note:
- no live app surface currently imports the routines helper layer
- keep these tables for now, but freeze them
- redesign them intentionally later when mentor routines become an active roadmap item

## What We Verified

1. New RevenueCat purchase events now create `program_access` rows successfully.
2. The app reads ownership from `program_access`, not `profiles.active_program`.
3. The RevenueCat webhook no longer writes legacy entitlement mirrors back into `profiles`.
4. The profile table no longer needs `questionnaire_completed`, `active_program`, `subscription_tier`, `subscription_status`, or the quiet-hours columns.

## Profiles Cleanup Summary

The dedicated `profiles` cleanup plan has been consolidated into this document.

Current state:
- `profiles` now holds identity, onboarding, preferences, and the optional RevenueCat bridge
- `program_access` is the source of truth for ownership and lifecycle state
- retired `profiles` columns are no longer part of the live schema
- the remaining bridge field is `revenuecat_app_user_id`

Keep in mind:
- the next table to audit is `program_progress`
- the profile cleanup work itself is complete enough to live here as a summary, rather than a separate plan file

## `program_progress`

This table is still a live part of the app's progress model.

What it owns:
- day-level completion history
- day-level partial-vs-complete state
- per-day unlock/completion rows
- time spent on a day
- progress timestamps for a program journey

How it differs from `program_access`:
- `program_access` is the ownership and entitlement snapshot
- `program_progress` is the detailed activity/history table for a program the user already owns

Current code paths:
- `providers/profile.tsx` updates progress as the user completes days
- `lib/access/service.ts` builds, syncs, hydrates, and persists the progress record
- `supabase/functions/revenuecat-webhook/index.ts` keeps the entitlement snapshot aligned, not the detailed day history

What we verified in the current audit:
- the app now writes progress through the `sync_program_progress` RPC only
- the old client delete+insert fallback is gone from `AccessService`
- `completeProgramDay` updates local state first, then syncs the normalized completed-day array to the server RPC
- day close behavior can now persist `PARTIAL` vs `COMPLETED` day rows without changing the calendar unlock cadence
- server hydration reads only completed rows and combines them with `program_access` to derive the active snapshot
- `sync_program_progress` now preserves each day's earliest known `completed_at` instead of rewriting history on later syncs
- current launch behavior is intentionally single-device-friendly and review-safe, even though it is not the final concurrency-hardened design

Cleanup note:
- the old `lib/api/progress.ts` helper has been retired
- the newer `AccessService` path is the active progress sync and hydration layer
- progress sync now goes through the `sync_program_progress` RPC only; the legacy client delete+insert fallback has been removed
- `sync_program_progress` now preserves the earliest per-day `completed_at` timestamps instead of rewriting them on every sync (small correctness hardening for launch)
- keep future progress cleanup focused on the live `AccessService` and server RPC path, not the deleted helper

Current decision:
- keep `program_progress`
- do not treat it as redundant with `program_access`
- audit it for stale helper code, not for deletion of the table itself
- accept the current RPC-based sync for launch
- defer stronger multi-device concurrency hardening until after review

Known cleanup residue:
- the migration history still contains older `program_progress` evolution steps, including legacy shapes like `program_uuid`
- generated database types now match the live schema after regeneration
- no active runtime code paths still reference the removed legacy columns (`program_progress.program_uuid`, `program_days.audio_url`, `programs.duration_days`, `programs.requires_audio`)

Staged cleanup:
- migration `20260418070000_drop_legacy_program_columns.sql` is applied and removed `program_progress.program_uuid`, `program_days.audio_url`, and `programs.duration_days/requires_audio`
- app content mappers now read only canonical columns (`total_days`, `has_audio`, `estimated_minutes`, `cards`)

## Database Cleanup Checklist

Completed:
- profiles cleanup completed (legacy entitlement mirrors and unused preference fields removed)
- ownership source of truth consolidated to `program_access`
- `sync_program_progress` moved to RPC-only path; client fallback removed
- `sync_program_progress` hardened to preserve earliest per-day `completed_at`
- onboarding state downgrade bug fixed in app writes (draft/profile upserts no longer force `onboarding_complete = false`)
- onboarding completion backfill re-run and verified (`0` users left with completion evidence but `onboarding_complete = false`)
- onboarding DB guardrail applied: `trg_profiles_prevent_onboarding_regression` now prevents `onboarding_complete` from regressing `TRUE -> FALSE`
- account deletion hardened: `transactions.user_id` now allows `ON DELETE SET NULL`
- `media_assets` dropped as unused schema surface
- legacy program compatibility columns dropped and code paths updated
- DB types regenerated from live schema and app/web typechecks revalidated
- web commerce reliability hardened:
  - checkout order creation now binds to authenticated session user (no client-side user-id trust)
  - app entitlement hydration now falls back to Supabase when RevenueCat is unavailable
  - idempotent fulfillment and route-level tests are in place for the main purchase path
  - optional reconciliation/monitoring endpoints exist, but are not required to be enabled for launch
- app onboarding context realignment added:
  - if a purchased owned program belongs to a different journey than the stored questionnaire context, the app now routes to a short re-alignment questionnaire instead of using stale answers
  - smoking-family purchases (`six_day_reset` <-> `ninety_day_transform`) are treated as the same journey and do not trigger re-alignment
- questionnaire history layer added:
  - completed onboarding runs are now dual-written to append-only `questionnaire_runs`
  - the app still reads live questionnaire state from `profiles.questionnaire_answers` for backward compatibility
- historical questionnaire backfill staged via `20260418110000_backfill_questionnaire_runs.sql`
- legacy questionnaire history backfill staged via `20260418111500_backfill_questionnaire_runs_from_onboarding_responses.sql`
- questionnaire history backfill verified:
  - `questionnaire_runs` now contains 14 legacy backfilled rows from `onboarding_responses`
  - journey/program mapping validated across smoking, sleep, energy, age-reversal, and male-vitality paths
  - one onboarded user has no recoverable legacy questionnaire history and will start fresh from the new dual-write path
- `onboarding_responses` dependency audited:
  - still read by `useOnboardingResponse()` in dashboard greeting/hero, account profile, and statistics surfaces
  - safe to treat as legacy compatibility baggage for now, but not safe to drop yet
- `program_reflections` audited:
  - not redundant with `journal_entries`
  - safe to keep as the guided reflection store
  - archive-read prep staged via `20260418123000_harden_program_reflections_archive_reads.sql`
- `user_routines` / `routine_checkins` audited:
  - not redundant with another live table, but currently dormant
  - schema is too thin for mentor-assigned/custom routines (`trigger_time` + `action` is only a placeholder model)
  - `routine_checkins.user_id` is denormalized relative to `routine_id -> user_routines.user_id` and should be revisited in the eventual redesign
  - safe to keep frozen for now; not launch-critical

Next:
- post-launch concurrency hardening for `sync_program_progress` (stronger multi-device conflict handling)
- optional post-launch schema hygiene: simplify old migration narrative docs so new contributors see only canonical model first
- keep `revenuecat_app_user_id` bridge in place until webhook identity strategy is intentionally changed
- run one real-provider checkout smoke test and one app cold-start verification before launch
- run the questionnaire re-alignment manual QA checklist before launch
- keep `questionnaire_runs` as the append-only history layer and let new runs accumulate from the live dual-write path
- migrate `useOnboardingResponse()` consumers to `profiles.questionnaire_answers` and/or `questionnaire_runs`, then freeze or remove `onboarding_responses`
- redesign `user_routines` / `routine_checkins` only when mentor routine system v1 is intentionally brought into scope

## Data Notes

These were the last audited legacy signals before cleanup:
- some old rows had `active_program`
- only two rows had `revenuecat_app_user_id`
- onboarding was not consistently marked complete for older records

Those gaps were handled or narrowed down during the cleanup pass.

## Current Decisions

- Keep `revenuecat_app_user_id` for now as a local identity bridge.
- Treat `program_access` as the ownership source of truth.
- Treat `profiles` as identity + onboarding + preferences only.
- Do not reintroduce entitlement mirrors into `profiles`.

## Launch Policy: One Active Program Per User

At launch, the product should behave like each user has one active recovery journey at a time.

Policy:
- one user may only have one active owned program in the app UX
- `program_access` may still store multiple rows in the database, but the app should surface only one active program at a time
- the active program is the one used for Home, Program, Day Detail, and completion state
- any second purchase or entitlement should not silently create a second active journey in the UI

Recommended launch behavior:
- if a user already has an active program, block or explicitly gate a new purchase attempt
- if the user completes the current program, then they can move to another program later
- support/manual overrides can still correct rows in the database if needed, but the default user flow stays singular

Why this is the right launch rule:
- simpler onboarding and support
- fewer edge cases in state selection
- consistent day-by-day experience
- easier analytics and troubleshooting

What we are intentionally not shipping at launch:
- a full multi-program dashboard
- active program switching UI
- simultaneous journeys shown side by side

## Next Step

The current database cleanup pass is good enough for launch.

The next cleanup decision should focus on:
- post-launch concurrency hardening for `sync_program_progress`
- keeping future cleanup targeted at live code paths, not retired helper history
