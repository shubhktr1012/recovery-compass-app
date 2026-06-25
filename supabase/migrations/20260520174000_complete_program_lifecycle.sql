BEGIN;

CREATE OR REPLACE FUNCTION public.complete_program_lifecycle(
  p_program_id text,
  p_completed_at timestamptz DEFAULT now()
)
RETURNS TABLE (
  owned_program text,
  current_day integer,
  completed_at timestamptz,
  purchase_state text,
  completion_state text,
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
  v_completed_at timestamptz := coalesce(p_completed_at, now());
  v_total_days integer;
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

  UPDATE public.program_access AS access
  SET
    current_day = v_total_days,
    purchase_state = 'owned_completed',
    completion_state = 'completed',
    completed_at = coalesce(access.completed_at, v_completed_at),
    paused_at = NULL,
    updated_at = now()
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_program_id
    AND access.purchase_state IN ('owned_active', 'owned_completed')
    AND access.completion_state IN ('not_started', 'in_progress', 'completed')
    AND access.archived_at IS NULL
  RETURNING
    access.owned_program,
    access.current_day,
    access.completed_at,
    access.purchase_state,
    access.completion_state,
    access.program_state,
    access.updated_at
  INTO
    owned_program,
    current_day,
    completed_at,
    purchase_state,
    completion_state,
    program_state,
    updated_at;

  IF owned_program IS NULL THEN
    RAISE EXCEPTION 'Program cannot be completed: %', v_program_id;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_program_lifecycle(text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_program_lifecycle(text, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
