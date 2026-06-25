BEGIN;

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
      WHEN public.derive_program_state(
        public.program_access.owned_program,
        public.program_access.purchase_state,
        public.program_access.completion_state,
        public.program_access.scheduled_start_date,
        public.program_access.paused_at
      ) IN ('scheduled', 'active', 'paused') THEN public.program_access.completion_state
      ELSE 'not_started'
    END,
    current_day = CASE
      WHEN public.program_access.completion_state = 'completed'
        OR public.derive_program_state(
          public.program_access.owned_program,
          public.program_access.purchase_state,
          public.program_access.completion_state,
          public.program_access.scheduled_start_date,
          public.program_access.paused_at
        ) IN ('scheduled', 'active', 'paused') THEN public.program_access.current_day
      ELSE NULL
    END,
    scheduled_start_date = CASE
      WHEN public.program_access.completion_state = 'completed'
        OR public.derive_program_state(
          public.program_access.owned_program,
          public.program_access.purchase_state,
          public.program_access.completion_state,
          public.program_access.scheduled_start_date,
          public.program_access.paused_at
        ) IN ('scheduled', 'active', 'paused') THEN public.program_access.scheduled_start_date
      ELSE NULL
    END,
    paused_at = CASE
      WHEN public.program_access.completion_state = 'completed'
        OR public.derive_program_state(
          public.program_access.owned_program,
          public.program_access.purchase_state,
          public.program_access.completion_state,
          public.program_access.scheduled_start_date,
          public.program_access.paused_at
        ) IN ('scheduled', 'active', 'paused') THEN public.program_access.paused_at
      ELSE NULL
    END,
    updated_at = now();

  PERFORM public.normalize_owned_program_priority_queue(v_user_id);

  RETURN QUERY
  SELECT
    access.owned_program,
    access.purchase_state,
    access.completion_state,
    public.derive_program_state(
      access.owned_program,
      access.purchase_state,
      access.completion_state,
      access.scheduled_start_date,
      access.paused_at
    ) AS program_state,
    access.priority_rank,
    access.updated_at
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_owned_program_purchase(text) TO authenticated;

COMMIT;
