BEGIN;

-- Keep content private to signed-in users and normalize user-owned policies to the
-- planner-friendly auth.uid() pattern.
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.programs;
DROP POLICY IF EXISTS "Anyone can read programs" ON public.programs;
CREATE POLICY "Authenticated users can read programs"
  ON public.programs
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Program days are viewable by everyone" ON public.program_days;
DROP POLICY IF EXISTS "Anyone can read program days" ON public.program_days;
CREATE POLICY "Authenticated users can read program days"
  ON public.program_days
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE public.program_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can insert their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can update their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can delete their own program access" ON public.program_access;

CREATE POLICY "Users can view their own program access"
  ON public.program_access
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own program access"
  ON public.program_access
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own program access"
  ON public.program_access
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own program access"
  ON public.program_access
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.program_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.program_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.program_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.program_progress;

CREATE POLICY "Users can view their own progress"
  ON public.program_progress
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.program_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.program_progress
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.program_progress
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.journal_entries;

CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON public.journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

ALTER TABLE public.program_reflections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own program reflections" ON public.program_reflections;
DROP POLICY IF EXISTS "Users can insert their own program reflections" ON public.program_reflections;
DROP POLICY IF EXISTS "Users can update their own program reflections" ON public.program_reflections;
DROP POLICY IF EXISTS "Users can delete their own program reflections" ON public.program_reflections;

CREATE POLICY "Users can view their own program reflections"
  ON public.program_reflections
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own program reflections"
  ON public.program_reflections
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own program reflections"
  ON public.program_reflections
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own program reflections"
  ON public.program_reflections
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS program_access_user_program_updated_idx
  ON public.program_access (user_id, owned_program, updated_at DESC);

CREATE INDEX IF NOT EXISTS program_progress_user_program_status_day_idx
  ON public.program_progress (user_id, program_id, status, day_id);

CREATE INDEX IF NOT EXISTS program_reflections_user_updated_at_idx
  ON public.program_reflections (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  bucket TEXT NOT NULL,
  identifier TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket, identifier, window_start)
);

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS edge_rate_limits_updated_at_idx
  ON public.edge_rate_limits (updated_at DESC);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket TEXT,
  p_identifier TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_request_count INTEGER;
BEGIN
  IF COALESCE(length(trim(p_bucket)), 0) = 0 OR COALESCE(length(trim(p_identifier)), 0) = 0 THEN
    RAISE EXCEPTION 'bucket and identifier are required';
  END IF;

  IF p_max_requests IS NULL OR p_max_requests < 1 OR p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit configuration';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.edge_rate_limits (
    bucket,
    identifier,
    window_start,
    request_count,
    created_at,
    updated_at
  )
  VALUES (
    trim(p_bucket),
    trim(p_identifier),
    v_window_start,
    1,
    v_now,
    v_now
  )
  ON CONFLICT (bucket, identifier, window_start)
  DO UPDATE SET
    request_count = public.edge_rate_limits.request_count + 1,
    updated_at = EXCLUDED.updated_at
  RETURNING request_count INTO v_request_count;

  RETURN QUERY
  SELECT
    v_request_count <= p_max_requests,
    GREATEST(p_max_requests - LEAST(v_request_count, p_max_requests), 0),
    v_window_start + make_interval(secs => p_window_seconds);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

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
      completed_at = EXCLUDED.completed_at,
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

COMMIT;
