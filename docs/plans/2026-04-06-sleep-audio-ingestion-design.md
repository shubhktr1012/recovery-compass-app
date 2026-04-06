# Sleep Audio Ingestion Design

## Goal

Wire the 21 uploaded `sleep_disorder_reset` audio files into the existing Recovery Compass program delivery flow with the smallest possible amount of manual work and without committing raw audio files into git.

## Current Context

- Audio playback is already implemented in the app via `expo-audio`.
- The app expects audio by `storagePath`, not by raw URL.
- Supabase Storage is already used as the delivery mechanism for program audio through signed URLs.
- The 21 Sleep audio files have already been uploaded to the `program-audio` bucket under `sleep_disorder_reset/`.
- Filenames have been normalized to `day-01.mp3` through `day-21.mp3`.

## Recommended Approach

Use a batch content update for the Sleep program only.

Instead of editing 21 rows manually in the Supabase dashboard or rebuilding the full content generation pipeline immediately, we should create a repo-tracked SQL migration that updates the Sleep program day content to point each day at its matching audio storage path.

This gives us:
- a fast path to shipping Sleep audio
- a durable record in git of how the data was changed
- a repeatable template for Energy, Men's Health, and other future audio imports

## Data Shape

Each Sleep day should point to:
- `sleep_disorder_reset/day-01.mp3`
- `sleep_disorder_reset/day-02.mp3`
- ...
- `sleep_disorder_reset/day-21.mp3`

The app will continue resolving those storage paths into signed Supabase URLs at runtime.

## Implementation Plan

1. Create a SQL migration that updates `program_days.content` for `sleep_disorder_reset`.
2. For each day 1-21, inject or replace the `audio` object with:
   - `storagePath`
   - optional duration if we can reliably compute it later
3. Keep the change scoped to Sleep only.
4. Verify the resulting storage paths appear in the app data layer.
5. Test playback on Day 1-3 before expanding the same workflow to other programs.

## Error Handling

- If a day record is missing, the migration should fail loudly or clearly reveal the gap.
- If duration metadata is unavailable right now, ship with `storagePath` first and backfill durations later.
- If the content shape differs from expectations, patch only the audio field and leave the rest of the day JSON untouched.

## Validation

Success means:
- Sleep days 1-21 each expose an audio payload in the app
- the app resolves signed URLs successfully from Supabase Storage
- Day 1-3 audio plays without changing any of the surrounding content flow

## Follow-up

After Sleep is verified, reuse the same structure for future program audio imports:
- local normalize
- Supabase bucket upload
- repo-tracked SQL/content update
- app verification
