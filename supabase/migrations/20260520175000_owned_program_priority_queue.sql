BEGIN;

ALTER TABLE public.program_access
  ADD COLUMN IF NOT EXISTS priority_rank integer;

COMMENT ON COLUMN public.program_access.priority_rank
  IS 'Optional ordering for owned waiting programs in My Programs; lower number means higher priority.';

CREATE INDEX IF NOT EXISTS program_access_user_priority_queue_idx
  ON public.program_access (user_id, priority_rank ASC NULLS LAST, updated_at DESC)
  WHERE owned_program IS NOT NULL
    AND purchase_state <> 'not_owned';

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
      AND public.derive_program_state(
        access.owned_program,
        access.purchase_state,
        access.completion_state,
        access.scheduled_start_date,
        access.paused_at
      ) = 'purchased'
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
      AND public.derive_program_state(
        access.owned_program,
        access.purchase_state,
        access.completion_state,
        access.scheduled_start_date,
        access.paused_at
      ) = 'purchased'
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
        AND public.derive_program_state(
          access.owned_program,
          access.purchase_state,
          access.completion_state,
          access.scheduled_start_date,
          access.paused_at
        ) = 'purchased'
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
      AND public.derive_program_state(
        access.owned_program,
        access.purchase_state,
        access.completion_state,
        access.scheduled_start_date,
        access.paused_at
      ) = 'purchased'
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
    public.derive_program_state(
      access.owned_program,
      access.purchase_state,
      access.completion_state,
      access.scheduled_start_date,
      access.paused_at
    ) AS program_state,
    access.updated_at
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program IS NOT NULL
    AND access.purchase_state <> 'not_owned'
    AND public.derive_program_state(
      access.owned_program,
      access.purchase_state,
      access.completion_state,
      access.scheduled_start_date,
      access.paused_at
    ) = 'purchased'
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

  -- The app sends a user-local date, while Postgres current_date is database-timezone
  -- based. Allow a one-day buffer so "today" does not fail west of UTC.
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
      AND public.derive_program_state(
        other_access.owned_program,
        other_access.purchase_state,
        other_access.completion_state,
        other_access.scheduled_start_date,
        other_access.paused_at
      ) IN ('scheduled', 'active', 'paused')
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

  IF EXISTS (
    SELECT 1
    FROM public.program_progress AS progress
    WHERE progress.user_id = v_user_id
      AND progress.program_id = v_program_id
      AND progress.status IN ('COMPLETED', 'PARTIAL')
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Program has already started: %', v_program_id;
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
    ),
    paused_at = NULL,
    priority_rank = NULL,
    updated_at = now()
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
    AND access.purchase_state = 'owned_active'
    AND access.completion_state IN ('not_started', 'in_progress')
    AND COALESCE(access.current_day, 1) = 1
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

REVOKE ALL ON FUNCTION public.normalize_owned_program_priority_queue(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reorder_owned_program_queue(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.configure_program_start(text, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.reorder_owned_program_queue(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.configure_program_start(text, date) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
