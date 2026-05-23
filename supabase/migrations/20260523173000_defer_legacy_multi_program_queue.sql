BEGIN;

ALTER TABLE public.user_program_preferences
  ADD COLUMN IF NOT EXISTS queue_reviewed_at timestamptz;

COMMENT ON COLUMN public.user_program_preferences.queue_reviewed_at
  IS 'Set after a user reviews the owned-program queue/resume order introduced for one-active-program lifecycle.';

CREATE OR REPLACE FUNCTION public.sync_program_access_program_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Explicitly support legacy programs that had already started before the
  -- one-active-program model. They are queued for later but keep their progress.
  IF NEW.program_state = 'purchased'
    AND NEW.owned_program IS NOT NULL
    AND NEW.purchase_state <> 'not_owned'
    AND NEW.completion_state = 'in_progress'
    AND NEW.scheduled_start_date IS NULL
    AND NEW.paused_at IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.program_state := public.derive_program_state(
    NEW.owned_program,
    NEW.purchase_state,
    NEW.completion_state,
    NEW.scheduled_start_date,
    NEW.paused_at
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_owned_program_priority_queue(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  WITH waiting AS (
    SELECT
      access.id,
      row_number() OVER (
        ORDER BY
          access.priority_rank ASC NULLS LAST,
          access.updated_at ASC,
          access.created_at ASC,
          access.owned_program ASC
      )::integer AS next_rank
    FROM public.program_access AS access
    WHERE access.user_id = p_user_id
      AND access.owned_program IS NOT NULL
      AND access.purchase_state <> 'not_owned'
      AND access.completion_state <> 'completed'
      AND access.program_state = 'purchased'
  )
  UPDATE public.program_access AS access
  SET
    priority_rank = waiting.next_rank,
    updated_at = now()
  FROM waiting
  WHERE access.id = waiting.id
    AND access.priority_rank IS DISTINCT FROM waiting.next_rank;

  UPDATE public.program_access AS access
  SET
    priority_rank = NULL,
    updated_at = now()
  WHERE access.user_id = p_user_id
    AND access.priority_rank IS NOT NULL
    AND NOT (
      access.owned_program IS NOT NULL
      AND access.purchase_state <> 'not_owned'
      AND access.completion_state <> 'completed'
      AND access.program_state = 'purchased'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_owned_program_queue(p_program_ids text[])
RETURNS TABLE (
  owned_program text,
  priority_rank integer,
  program_state text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_program_ids text[];
  v_program_id text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT coalesce(array_agg(program_id), ARRAY[]::text[])
  INTO v_program_ids
  FROM (
    SELECT lower(trim(program_id)) AS program_id
    FROM unnest(coalesce(p_program_ids, ARRAY[]::text[])) AS program_id
    WHERE lower(trim(program_id)) <> ''
  ) AS normalized;

  IF cardinality(v_program_ids) <> (
    SELECT count(DISTINCT program_id)::integer
    FROM unnest(v_program_ids) AS program_id
  ) THEN
    RAISE EXCEPTION 'Duplicate program ids are not allowed';
  END IF;

  FOREACH v_program_id IN ARRAY v_program_ids LOOP
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
      FROM public.program_access AS access
      WHERE access.user_id = v_user_id
        AND access.owned_program = v_program_id
        AND access.purchase_state <> 'not_owned'
        AND access.completion_state <> 'completed'
        AND access.program_state = 'purchased'
      LIMIT 1
    ) THEN
      RAISE EXCEPTION 'Program is not waiting in the owned queue: %', v_program_id;
    END IF;
  END LOOP;

  WITH requested AS (
    SELECT program_id, ordinality
    FROM unnest(v_program_ids) WITH ORDINALITY AS requested(program_id, ordinality)
  ),
  waiting AS (
    SELECT
      access.id,
      access.owned_program,
      access.priority_rank,
      access.updated_at,
      access.created_at,
      requested.ordinality
    FROM public.program_access AS access
    LEFT JOIN requested
      ON requested.program_id = access.owned_program
    WHERE access.user_id = v_user_id
      AND access.owned_program IS NOT NULL
      AND access.purchase_state <> 'not_owned'
      AND access.completion_state <> 'completed'
      AND access.program_state = 'purchased'
  ),
  ordered AS (
    SELECT
      waiting.id,
      row_number() OVER (
        ORDER BY
          CASE WHEN waiting.ordinality IS NULL THEN 1 ELSE 0 END,
          waiting.ordinality ASC NULLS LAST,
          waiting.priority_rank ASC NULLS LAST,
          waiting.updated_at ASC,
          waiting.created_at ASC,
          waiting.owned_program ASC
      )::integer AS next_rank
    FROM waiting
  )
  UPDATE public.program_access AS access
  SET
    priority_rank = ordered.next_rank,
    updated_at = now()
  FROM ordered
  WHERE access.id = ordered.id
    AND access.priority_rank IS DISTINCT FROM ordered.next_rank;

  RETURN QUERY
  SELECT
    access.owned_program,
    access.priority_rank,
    access.program_state,
    access.updated_at
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program IS NOT NULL
    AND access.purchase_state <> 'not_owned'
    AND access.completion_state <> 'completed'
    AND access.program_state = 'purchased'
  ORDER BY access.priority_rank ASC NULLS LAST, access.updated_at ASC, access.owned_program ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.configure_program_start(
  p_program_id text,
  p_scheduled_start_date date
)
RETURNS TABLE (
  owned_program text,
  scheduled_start_date date,
  started_at timestamptz,
  program_state text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
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

  IF p_scheduled_start_date IS NULL THEN
    RAISE EXCEPTION 'scheduled_start_date is required';
  END IF;

  IF p_scheduled_start_date < current_date - 1 THEN
    RAISE EXCEPTION 'scheduled_start_date is too far in the past';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.program_access AS other_access
    WHERE other_access.user_id = v_user_id
      AND other_access.owned_program IS NOT NULL
      AND other_access.owned_program <> v_program_id
      AND other_access.purchase_state <> 'not_owned'
      AND other_access.program_state IN ('scheduled', 'active', 'paused')
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Another program is already active or scheduled';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.program_access AS access
    WHERE access.user_id = v_user_id
      AND access.owned_program = v_program_id
      AND access.purchase_state = 'owned_active'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Program is not owned: %', v_program_id;
  END IF;

  UPDATE public.program_access AS access
  SET
    scheduled_start_date = p_scheduled_start_date,
    started_at = make_timestamptz(
      extract(year from p_scheduled_start_date)::int,
      extract(month from p_scheduled_start_date)::int,
      extract(day from p_scheduled_start_date)::int,
      5,
      0,
      0,
      current_setting('timezone')
    ) - ((GREATEST(coalesce(access.current_day, 1), 1) - 1) * interval '1 day'),
    paused_at = NULL,
    priority_rank = NULL,
    updated_at = now()
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
    AND access.purchase_state = 'owned_active'
    AND access.completion_state IN ('not_started', 'in_progress')
    AND access.program_state = 'purchased'
  RETURNING
    access.owned_program,
    access.scheduled_start_date,
    access.started_at,
    access.program_state,
    access.updated_at
  INTO
    owned_program,
    scheduled_start_date,
    started_at,
    program_state,
    updated_at;

  IF owned_program IS NULL THEN
    RAISE EXCEPTION 'Program start cannot be configured: %', v_program_id;
  END IF;

  PERFORM public.normalize_owned_program_priority_queue(v_user_id);

  RETURN NEXT;
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
SECURITY DEFINER
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

CREATE TEMP TABLE legacy_multi_program_selection ON COMMIT DROP AS
WITH blocking AS (
  SELECT
    access.id,
    access.user_id,
    access.owned_program,
    access.current_day,
    access.updated_at,
    access.created_at,
    preferences.active_program
  FROM public.program_access AS access
  LEFT JOIN public.user_program_preferences AS preferences
    ON preferences.user_id = access.user_id
  WHERE access.owned_program IS NOT NULL
    AND access.purchase_state <> 'not_owned'
    AND access.completion_state <> 'completed'
    AND access.program_state IN ('active', 'scheduled', 'paused')
),
ranked AS (
  SELECT
    blocking.*,
    row_number() OVER (
      PARTITION BY blocking.user_id
      ORDER BY
        CASE WHEN blocking.active_program = blocking.owned_program THEN 0 ELSE 1 END,
        coalesce(blocking.current_day, 0) DESC,
        blocking.updated_at DESC,
        blocking.created_at DESC,
        blocking.owned_program ASC
    ) AS active_rank,
    count(*) OVER (PARTITION BY blocking.user_id) AS blocking_count
  FROM blocking
)
SELECT *
FROM ranked
WHERE blocking_count > 1;

INSERT INTO public.user_program_preferences (
  user_id,
  active_program,
  created_at,
  updated_at
)
SELECT
  selection.user_id,
  selection.owned_program,
  now(),
  now()
FROM legacy_multi_program_selection AS selection
WHERE selection.active_rank = 1
ON CONFLICT (user_id) DO UPDATE
SET
  active_program = EXCLUDED.active_program,
  updated_at = now();

UPDATE public.program_access AS access
SET
  program_state = 'purchased',
  scheduled_start_date = NULL,
  paused_at = NULL,
  priority_rank = NULL,
  updated_at = now()
FROM legacy_multi_program_selection AS selection
WHERE selection.active_rank > 1
  AND access.id = selection.id;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT DISTINCT user_id
    FROM legacy_multi_program_selection
  LOOP
    PERFORM public.normalize_owned_program_priority_queue(v_user_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_owned_program_priority_queue(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reorder_owned_program_queue(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.configure_program_start(text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reorder_owned_program_queue(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.configure_program_start(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_owned_program_purchase(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
