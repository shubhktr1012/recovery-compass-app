# Day Completion Cadence Design

Date: April 10, 2026
Branch: `rebuild/multi-program`

## Summary

Recovery Compass should treat program progression as a calendar-based cadence rather than a completion-gated ladder. A user should never be blocked from the next scheduled day because they did not finish the previous one. Completion still matters, but it is tracked separately from the unlock schedule.

This design applies the same rule to all launch programs for consistency.

## Product Rule

- Day 1 is available as soon as a program starts.
- New days unlock at 5:00 AM local time.
- Unlock cadence advances by calendar schedule, not by completion.
- Completing a day marks that day as completed but does not instantly unlock the next day.
- Completed days remain reopenable in review mode.
- Earlier unlocked but incomplete days remain accessible.
- Future days remain locked.

## Why This Model

- It avoids punishing users for missing a day.
- It preserves the rhythm of a guided program.
- It matches the brand promise of steady progress without pressure.
- It keeps rules simple and consistent across all programs at launch.

## States

Each day in the Program tab should resolve to one of four states:

- `completed`: user completed the day; still tappable in review mode
- `today`: the current scheduled day; primary focus state
- `available`: an earlier unlocked day that was not completed
- `locked`: future day that has not reached its unlock time yet

## Data Model

We need one schedule anchor on `program_access`:

- `started_at timestamptz null`

This records when the program cadence began. Existing rows should backfill from `created_at`.

We continue using:

- `program_access.current_day` as the current scheduled day snapshot
- `program_progress.completed_days` as actual completion history
- `program_progress.completed_at` only when the final program day is completed

## Schedule Derivation

The scheduled day is derived from:

- the local calendar date of `started_at`
- the current local date adjusted for a 5:00 AM unlock boundary

Rule:

- if the current local time is before 5:00 AM, treat the effective date as the previous calendar day
- otherwise use the current local date
- scheduled day = days between effective date and local start date + 1
- clamp to `1...totalDays`

This ensures a program started at 2:00 AM still keeps Day 1 active until 5:00 AM the next calendar day, not the same morning.

## Completion Flow

On the last card of a day, show an explicit `Complete day` CTA.

When tapped:

- mark the current day as completed
- update local and Supabase progress
- keep the scheduled cadence intact
- if the user completed the final day, mark the program completed and keep current completion/archive behavior
- otherwise show a calm acknowledgment that the next day unlocks tomorrow at 5:00 AM

## Program Tab Behavior

- Completed day: tappable, marked completed
- Today day: tappable, strongest emphasis
- Available earlier day: tappable, secondary emphasis
- Locked future day: disabled, optionally show unlock timing

The Program tab should never use shame language like "missed" or "behind".

## Day Detail Behavior

- In-progress or available day: normal reading flow
- Current day: can be completed
- Completed day: review mode, no duplicate completion
- Locked future day: cannot be entered from Program tab

## Not In Scope For V1

- custom unlock times
- streaks or gamification
- notification scheduling
- mentor routine integration
- post-completion analytics
- forcing users to journal before completion

## Implementation Order

1. Add `started_at` to `program_access` and generated DB types
2. Add schedule helper utilities to derive scheduled day and next unlock time
3. Update access/profile state logic so completion no longer advances the calendar
4. Update Program tab states to reflect completed/today/available/locked
5. Add explicit day completion CTA in day detail and prevent duplicate completion
6. Add calm day-complete acknowledgment surface if time permits

## Launch Safety

This approach gives us a review-safe v1:

- humane progression
- deterministic unlock behavior
- no extra settings surface
- no auth or purchase risk
