BEGIN;

CREATE OR REPLACE FUNCTION public.record_verified_owned_program_purchase(
  p_user_id uuid,
  p_program_id text,
  p_revenuecat_app_user_id text DEFAULT NULL,
  p_revenuecat_product_id text DEFAULT NULL
)
RETURNS TABLE (
  owned_program text,
  purchase_state text,
  completion_state text,
  program_state text,
  priority_rank integer,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := p_user_id;
  v_program_id text := lower(trim(coalesce(p_program_id, '')));
  v_revenuecat_app_user_id text := nullif(trim(coalesce(p_revenuecat_app_user_id, '')), '');
  v_revenuecat_product_id text := nullif(trim(coalesce(p_revenuecat_product_id, '')), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF v_program_id NOT IN (
    'six_day_reset',
    'ninety_day_transform',
    'sleep_disorder_reset',
    'energy_vitality',
    'age_reversal',
    'male_sexual_health'
  ) THEN
    RAISE EXCEPTION 'Unknown program_id: %', v_program_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = v_user_id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Profile not found: %', v_user_id;
  END IF;

  IF v_revenuecat_app_user_id IS NOT NULL THEN
    UPDATE public.profiles AS profile
    SET
      revenuecat_app_user_id = v_revenuecat_app_user_id,
      updated_at = now()
    WHERE profile.id = v_user_id
      AND profile.revenuecat_app_user_id IS DISTINCT FROM v_revenuecat_app_user_id;
  END IF;

  INSERT INTO public.program_access (
    user_id,
    owned_program,
    purchase_state,
    completion_state,
    current_day,
    completed_at,
    archived_at,
    scheduled_start_date,
    paused_at,
    priority_rank,
    revenuecat_product_id,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_program_id,
    'owned_active',
    'not_started',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    v_revenuecat_product_id,
    now(),
    now()
  )
  ON CONFLICT ON CONSTRAINT program_access_user_program_unique
  DO UPDATE SET
    purchase_state = CASE
      WHEN public.program_access.completion_state = 'completed' THEN 'owned_completed'
      ELSE 'owned_active'
    END,
    completion_state = CASE
      WHEN public.program_access.completion_state = 'completed' THEN 'completed'
      WHEN public.program_access.program_state IN ('purchased', 'scheduled', 'active', 'paused') THEN public.program_access.completion_state
      ELSE 'not_started'
    END,
    current_day = CASE
      WHEN public.program_access.completion_state = 'completed'
        OR public.program_access.program_state IN ('purchased', 'scheduled', 'active', 'paused') THEN public.program_access.current_day
      ELSE NULL
    END,
    scheduled_start_date = CASE
      WHEN public.program_access.completion_state = 'completed'
        OR public.program_access.program_state IN ('scheduled', 'active', 'paused') THEN public.program_access.scheduled_start_date
      ELSE NULL
    END,
    paused_at = CASE
      WHEN public.program_access.completion_state = 'completed'
        OR public.program_access.program_state IN ('scheduled', 'active', 'paused') THEN public.program_access.paused_at
      ELSE NULL
    END,
    revenuecat_product_id = coalesce(v_revenuecat_product_id, public.program_access.revenuecat_product_id),
    updated_at = now();

  PERFORM public.normalize_owned_program_priority_queue(v_user_id);

  RETURN QUERY
  SELECT
    access.owned_program,
    access.purchase_state,
    access.completion_state,
    access.program_state,
    access.priority_rank,
    access.updated_at
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_owned_program_purchase(p_program_id text)
RETURNS TABLE (
  owned_program text,
  purchase_state text,
  completion_state text,
  program_state text,
  priority_rank integer,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_program_id text := lower(trim(coalesce(p_program_id, '')));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_program_id NOT IN (
    'six_day_reset',
    'ninety_day_transform',
    'sleep_disorder_reset',
    'energy_vitality',
    'age_reversal',
    'male_sexual_health'
  ) THEN
    RAISE EXCEPTION 'Unknown program_id: %', v_program_id;
  END IF;

  RETURN QUERY
  SELECT
    access.owned_program,
    access.purchase_state,
    access.completion_state,
    access.program_state,
    access.priority_rank,
    access.updated_at
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
    AND access.purchase_state <> 'not_owned'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verified purchase not found: %', v_program_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_program_progress(
  p_program_id text,
  p_current_day integer,
  p_completed_days integer[] DEFAULT '{}'::integer[],
  p_partial_days integer[] DEFAULT '{}'::integer[],
  p_completed_at timestamptz DEFAULT NULL,
  p_archived_at timestamptz DEFAULT NULL
)
RETURNS TABLE (
  current_day integer,
  completed_days integer[],
  completed_at timestamptz,
  archived_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_program_id text := lower(trim(coalesce(p_program_id, '')));
  v_total_days integer;
  v_completed_days integer[] := '{}'::integer[];
  v_partial_days integer[] := '{}'::integer[];
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.program_access AS access
    WHERE access.user_id = v_user_id
      AND access.owned_program = v_program_id
      AND access.purchase_state <> 'not_owned'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Program is not owned: %', v_program_id;
  END IF;

  IF p_current_day IS NULL OR p_current_day < 1 OR p_current_day > v_total_days THEN
    RAISE EXCEPTION 'current_day must be between 1 and %', v_total_days;
  END IF;

  SELECT coalesce(array_agg(day_number ORDER BY day_number), '{}'::integer[])
  INTO v_completed_days
  FROM (
    SELECT DISTINCT day_number
    FROM unnest(coalesce(p_completed_days, '{}'::integer[])) AS day_number
    WHERE day_number BETWEEN 1 AND v_total_days
  ) normalized_days;

  SELECT coalesce(array_agg(day_number ORDER BY day_number), '{}'::integer[])
  INTO v_partial_days
  FROM (
    SELECT DISTINCT day_number
    FROM unnest(coalesce(p_partial_days, '{}'::integer[])) AS day_number
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
      false,
      now(),
      p_current_day,
      v_completed_days,
      now(),
      now()
    FROM unnest(v_partial_days) AS partial_day
    ON CONFLICT (user_id, program_id, day_id)
    DO UPDATE SET
      status = 'PARTIAL',
      content_completed = false,
      current_day = EXCLUDED.current_day,
      completed_days = EXCLUDED.completed_days,
      updated_at = now();
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
      true,
      coalesce(p_completed_at, now()),
      p_current_day,
      v_completed_days,
      now(),
      now()
    FROM unnest(v_completed_days) AS completed_day
    ON CONFLICT (user_id, program_id, day_id)
    DO UPDATE SET
      status = 'COMPLETED',
      content_completed = true,
      completed_at = CASE
        WHEN public.program_progress.status = 'COMPLETED'
          THEN LEAST(public.program_progress.completed_at, EXCLUDED.completed_at)
        ELSE EXCLUDED.completed_at
      END,
      current_day = EXCLUDED.current_day,
      completed_days = EXCLUDED.completed_days,
      updated_at = now();
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
  p_program_id text,
  p_current_day integer,
  p_completed_days integer[] DEFAULT '{}'::integer[],
  p_completed_at timestamptz DEFAULT NULL,
  p_archived_at timestamptz DEFAULT NULL
)
RETURNS TABLE (
  current_day integer,
  completed_days integer[],
  completed_at timestamptz,
  archived_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
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
    p_partial_days => '{}'::integer[],
    p_completed_at => p_completed_at,
    p_archived_at => p_archived_at
  ) AS result;
$$;

CREATE OR REPLACE FUNCTION public.sync_program_progress_v2(
  p_program_id text,
  p_current_day integer,
  p_completed_days integer[] DEFAULT '{}'::integer[],
  p_partial_days integer[] DEFAULT '{}'::integer[],
  p_completed_at timestamptz DEFAULT NULL,
  p_archived_at timestamptz DEFAULT NULL
)
RETURNS TABLE (
  current_day integer,
  completed_days integer[],
  completed_at timestamptz,
  archived_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
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

REVOKE ALL ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_owned_program_purchase(text) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_program_progress(text, integer, integer[], integer[], timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_program_progress(text, integer, integer[], integer[], timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(text, integer, integer[], integer[], timestamptz, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_program_progress(text, integer, integer[], timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_program_progress(text, integer, integer[], timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(text, integer, integer[], timestamptz, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_program_progress_v2(text, integer, integer[], integer[], timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_program_progress_v2(text, integer, integer[], integer[], timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_program_progress_v2(text, integer, integer[], integer[], timestamptz, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
