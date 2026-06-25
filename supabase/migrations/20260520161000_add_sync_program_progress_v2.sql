BEGIN;

CREATE OR REPLACE FUNCTION public.sync_program_progress_v2(
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
    p_partial_days => p_partial_days,
    p_completed_at => p_completed_at,
    p_archived_at => p_archived_at
  ) AS result;
$$;

REVOKE ALL ON FUNCTION public.sync_program_progress_v2(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_program_progress_v2(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMIT;
