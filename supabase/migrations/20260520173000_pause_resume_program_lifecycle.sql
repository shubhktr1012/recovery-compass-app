BEGIN;

CREATE OR REPLACE FUNCTION public.pause_program_for_absence(
  p_program_id text,
  p_current_day integer,
  p_paused_at timestamptz DEFAULT now()
)
RETURNS TABLE (
  owned_program text,
  current_day integer,
  paused_at timestamptz,
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

  IF p_current_day IS NULL OR p_current_day < 1 THEN
    RAISE EXCEPTION 'current_day is required';
  END IF;

  UPDATE public.program_access AS access
  SET
    current_day = p_current_day,
    paused_at = coalesce(p_paused_at, now()),
    updated_at = now()
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
    AND access.purchase_state = 'owned_active'
    AND access.completion_state IN ('not_started', 'in_progress')
    AND access.started_at IS NOT NULL
    AND access.completed_at IS NULL
    AND access.archived_at IS NULL
    AND access.paused_at IS NULL
  RETURNING
    access.owned_program,
    access.current_day,
    access.paused_at,
    access.program_state,
    access.updated_at
  INTO
    owned_program,
    current_day,
    paused_at,
    program_state,
    updated_at;

  IF owned_program IS NULL THEN
    RAISE EXCEPTION 'Program cannot be paused: %', v_program_id;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_program_from_pause(
  p_program_id text,
  p_started_at timestamptz
)
RETURNS TABLE (
  owned_program text,
  current_day integer,
  started_at timestamptz,
  paused_at timestamptz,
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

  IF p_started_at IS NULL THEN
    RAISE EXCEPTION 'started_at is required';
  END IF;

  UPDATE public.program_access AS access
  SET
    started_at = p_started_at,
    scheduled_start_date = p_started_at::date,
    paused_at = NULL,
    updated_at = now()
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
    AND access.purchase_state = 'owned_active'
    AND access.completion_state IN ('not_started', 'in_progress')
    AND access.paused_at IS NOT NULL
    AND access.completed_at IS NULL
    AND access.archived_at IS NULL
  RETURNING
    access.owned_program,
    access.current_day,
    access.started_at,
    access.paused_at,
    access.program_state,
    access.updated_at
  INTO
    owned_program,
    current_day,
    started_at,
    paused_at,
    program_state,
    updated_at;

  IF owned_program IS NULL THEN
    RAISE EXCEPTION 'Program cannot be resumed: %', v_program_id;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resume_program_from_pause(text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_program_from_pause(text, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
