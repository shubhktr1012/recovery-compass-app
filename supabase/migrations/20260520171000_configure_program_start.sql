BEGIN;

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

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.configure_program_start(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configure_program_start(text, date) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
