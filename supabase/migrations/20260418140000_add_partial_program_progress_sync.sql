BEGIN;

-- Add first-class partial day support without breaking the older 5-argument
-- sync_program_progress callers. New clients can pass p_partial_days, while the
-- existing app build can continue calling the legacy signature.

CREATE OR REPLACE FUNCTION public.sync_program_progress(
  p_program_id TEXT,
  p_current_day INTEGER,
  p_completed_days INTEGER[] DEFAULT '{}'::INTEGER[],
  p_partial_days INTEGER[] DEFAULT '{}'::INTEGER[],
  p_completed_at TIMESTAMPTZ DEFAULT NULL,
  p_archived_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  current_day INTEGER,
  completed_days INTEGER[],
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_program_id TEXT := lower(trim(COALESCE(p_program_id, '')));
  v_total_days INTEGER;
  v_completed_days INTEGER[] := '{}'::INTEGER[];
  v_partial_days INTEGER[] := '{}'::INTEGER[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_program_id = '' THEN
    RAISE EXCEPTION 'program_id is required';
  END IF;

  SELECT total_days
  INTO v_total_days
  FROM public.programs
  WHERE slug = v_program_id
    AND is_active IS NOT FALSE
  LIMIT 1;

  IF v_total_days IS NULL THEN
    RAISE EXCEPTION 'Unknown program_id: %', v_program_id;
  END IF;

  IF p_current_day IS NULL OR p_current_day < 1 OR p_current_day > v_total_days THEN
    RAISE EXCEPTION 'current_day must be between 1 and %', v_total_days;
  END IF;

  SELECT COALESCE(array_agg(day_number ORDER BY day_number), '{}'::INTEGER[])
  INTO v_completed_days
  FROM (
    SELECT DISTINCT day_number
    FROM unnest(COALESCE(p_completed_days, '{}'::INTEGER[])) AS day_number
    WHERE day_number BETWEEN 1 AND v_total_days
  ) normalized_days;

  SELECT COALESCE(array_agg(day_number ORDER BY day_number), '{}'::INTEGER[])
  INTO v_partial_days
  FROM (
    SELECT DISTINCT day_number
    FROM unnest(COALESCE(p_partial_days, '{}'::INTEGER[])) AS day_number
    WHERE day_number BETWEEN 1 AND v_total_days
      AND NOT (day_number = ANY(v_completed_days))
  ) normalized_days;

  DELETE FROM public.program_progress
  WHERE user_id = v_user_id
    AND program_id = v_program_id
    AND NOT (
      (status = 'COMPLETED' AND day_id = ANY(v_completed_days))
      OR (status = 'PARTIAL' AND day_id = ANY(v_partial_days))
    );

  IF array_length(v_partial_days, 1) IS NOT NULL THEN
    INSERT INTO public.program_progress (
      user_id,
      program_id,
      day_id,
      status,
      content_completed,
      completed_at,
      current_day,
      completed_days,
      created_at,
      updated_at
    )
    SELECT
      v_user_id,
      v_program_id,
      partial_day,
      'PARTIAL',
      FALSE,
      NOW(),
      p_current_day,
      v_completed_days,
      NOW(),
      NOW()
    FROM unnest(v_partial_days) AS partial_day
    ON CONFLICT (user_id, program_id, day_id)
    DO UPDATE SET
      status = 'PARTIAL',
      content_completed = FALSE,
      current_day = EXCLUDED.current_day,
      completed_days = EXCLUDED.completed_days,
      updated_at = NOW();
  END IF;

  IF array_length(v_completed_days, 1) IS NOT NULL THEN
    INSERT INTO public.program_progress (
      user_id,
      program_id,
      day_id,
      status,
      content_completed,
      completed_at,
      current_day,
      completed_days,
      created_at,
      updated_at
    )
    SELECT
      v_user_id,
      v_program_id,
      completed_day,
      'COMPLETED',
      TRUE,
      COALESCE(p_completed_at, NOW()),
      p_current_day,
      v_completed_days,
      NOW(),
      NOW()
    FROM unnest(v_completed_days) AS completed_day
    ON CONFLICT (user_id, program_id, day_id)
    DO UPDATE SET
      status = 'COMPLETED',
      content_completed = TRUE,
      completed_at = CASE
        WHEN public.program_progress.status = 'COMPLETED'
          THEN LEAST(public.program_progress.completed_at, EXCLUDED.completed_at)
        ELSE EXCLUDED.completed_at
      END,
      current_day = EXCLUDED.current_day,
      completed_days = EXCLUDED.completed_days,
      updated_at = NOW();
  END IF;

  RETURN QUERY
  SELECT
    p_current_day,
    v_completed_days,
    p_completed_at,
    p_archived_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_program_progress(
  p_program_id TEXT,
  p_current_day INTEGER,
  p_completed_days INTEGER[] DEFAULT '{}'::INTEGER[],
  p_completed_at TIMESTAMPTZ DEFAULT NULL,
  p_archived_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  current_day INTEGER,
  completed_days INTEGER[],
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    result.current_day,
    result.completed_days,
    result.completed_at,
    result.archived_at
  FROM public.sync_program_progress(
    p_program_id => p_program_id,
    p_current_day => p_current_day,
    p_completed_days => p_completed_days,
    p_partial_days => '{}'::INTEGER[],
    p_completed_at => p_completed_at,
    p_archived_at => p_archived_at
  ) AS result;
$$;

REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMIT;
