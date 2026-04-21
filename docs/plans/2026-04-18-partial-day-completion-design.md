# Partial Day Completion Design

Date: 2026-04-18

## Goal

Allow a user to close a day even when required routine tasks are unfinished, without falsely marking the day as fully complete.

## Product Rules

- New days still unlock on the existing calendar cadence at 5:00 AM local time.
- Unlocking is not blocked by whether the previous day is complete or partial.
- A day can be in one of three progress states from the user's perspective:
  - available / not started
  - partial
  - completed
- `partial` means the user closed the day without finishing all required routine tasks.
- `completed` means the user explicitly marked the day fully complete.
- `partial` does not count toward final program completion.
- Users can revisit a partial day later and upgrade it to completed.

## Launch-Safe Scope

- Required tasks are limited to `exercise_routine` checklist items.
- Journal and reflection cards remain optional.
- Audio remains optional for now.
- Routine checklist completion is tracked locally in the app for the close-of-day decision.
- The day-level partial/completed state is persisted in `program_progress`.

## Data Model

Use the existing `program_progress` table:

- `status = 'PARTIAL'` for partially closed days
- `status = 'COMPLETED'` for fully completed days
- `content_completed = FALSE` for partial rows
- `content_completed = TRUE` for completed rows

Extend the `sync_program_progress` RPC to accept both:
- `p_completed_days`
- `p_partial_days`

The RPC should:
- normalize both arrays
- remove rows no longer present in either set
- upsert `PARTIAL` rows for partial days
- upsert `COMPLETED` rows for completed days
- ensure completed wins if a day appears in both lists

## App State

Extend `ProgramProgressRecord` with `partialDays: number[]`.

Hydration rules:
- `COMPLETED` rows hydrate into `completedDays`
- `PARTIAL` rows hydrate into `partialDays`
- if a day is completed, it must not remain partial in memory

Derived behavior:
- progress percentage uses only `completedDays`
- final program completion only occurs when the final day is in `completedDays`

## UX

When a day contains routine tasks:
- if all routine items are checked, show `Complete Day`
- if some are unchecked, show `Save as Partial`
- if the day is already partial, show `Mark Fully Complete`

If the user attempts to fully complete while routine tasks are still unchecked in the current session, show a calm confirmation and offer `Save as Partial` instead.

Timeline presentation:
- completed day: existing completed treatment
- partial day: distinct but quieter than completed
- locked day: unchanged

## Rollout Safety

- Additive DB migration only
- Client should tolerate RPC failure by preserving existing completed-day sync behavior
- Partial days may degrade gracefully to local-only until the migration is applied, but completed days must continue working
