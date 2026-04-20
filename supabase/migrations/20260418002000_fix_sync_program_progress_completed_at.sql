-- Keep `sync_program_progress` launch-safe but stop clobbering historical per-day `completed_at`
-- timestamps on every sync. When a user completes additional days, we want earlier days to retain
-- their original completion time rather than being updated to "now".

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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_program_id TEXT := lower(trim(COALESCE(p_program_id, '')));
  v_total_days INTEGER;
  v_completed_days INTEGER[] := '{}'::INTEGER[];
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

  DELETE FROM public.program_progress
  WHERE user_id = v_user_id
    AND program_id = v_program_id
    AND status <> 'COMPLETED';

  DELETE FROM public.program_progress
  WHERE user_id = v_user_id
    AND program_id = v_program_id
    AND status = 'COMPLETED'
    AND NOT (day_id = ANY(v_completed_days));

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
      -- Preserve the earliest known completion time for this day.
      completed_at = LEAST(public.program_progress.completed_at, EXCLUDED.completed_at),
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

REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

