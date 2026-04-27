-- Normalize step rows created before the 5 AM program-day boundary change.
-- Only shift rows that are clearly in the old format:
--   1. the stored local_date matches the recorded local calendar date, and
--   2. the local recorded hour is before 5 AM
--
-- New rows already written with the 5 AM boundary will not match that pattern.

WITH candidate_rows AS (
  SELECT
    id,
    user_id,
    local_date,
    timezone,
    steps,
    source,
    provider_status,
    recorded_at,
    created_at,
    updated_at,
    (recorded_at AT TIME ZONE timezone)::date AS recorded_local_date,
    EXTRACT(HOUR FROM (recorded_at AT TIME ZONE timezone)) AS recorded_local_hour
  FROM public.daily_step_counts
),
rows_to_shift AS (
  SELECT
    id,
    user_id,
    (recorded_local_date - 1) AS target_local_date,
    timezone,
    steps,
    source,
    provider_status,
    recorded_at,
    created_at,
    updated_at
  FROM candidate_rows
  WHERE local_date = recorded_local_date
    AND recorded_local_hour < 5
),
upsert_shifted_rows AS (
  INSERT INTO public.daily_step_counts (
    user_id,
    local_date,
    timezone,
    steps,
    source,
    provider_status,
    recorded_at,
    created_at,
    updated_at
  )
  SELECT
    user_id,
    target_local_date,
    timezone,
    steps,
    source,
    provider_status,
    recorded_at,
    created_at,
    updated_at
  FROM rows_to_shift
  ON CONFLICT (user_id, local_date) DO UPDATE
  SET
    steps = GREATEST(public.daily_step_counts.steps, EXCLUDED.steps),
    timezone = CASE
      WHEN EXCLUDED.recorded_at >= public.daily_step_counts.recorded_at
        THEN EXCLUDED.timezone
      ELSE public.daily_step_counts.timezone
    END,
    source = CASE
      WHEN EXCLUDED.recorded_at >= public.daily_step_counts.recorded_at
        THEN EXCLUDED.source
      ELSE public.daily_step_counts.source
    END,
    provider_status = CASE
      WHEN EXCLUDED.recorded_at >= public.daily_step_counts.recorded_at
        THEN EXCLUDED.provider_status
      ELSE public.daily_step_counts.provider_status
    END,
    recorded_at = GREATEST(public.daily_step_counts.recorded_at, EXCLUDED.recorded_at),
    created_at = LEAST(public.daily_step_counts.created_at, EXCLUDED.created_at)
  RETURNING user_id, local_date
)
DELETE FROM public.daily_step_counts
WHERE id IN (SELECT id FROM rows_to_shift);
