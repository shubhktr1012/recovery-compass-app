BEGIN;

CREATE OR REPLACE FUNCTION public.derive_program_state(
  p_owned_program text,
  p_purchase_state text,
  p_completion_state text,
  p_scheduled_start_date date,
  p_paused_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_owned_program IS NULL OR p_purchase_state = 'not_owned' THEN
    RETURN 'not_owned';
  END IF;

  IF p_completion_state = 'completed' THEN
    RETURN 'completed';
  END IF;

  IF p_paused_at IS NOT NULL THEN
    RETURN 'paused';
  END IF;

  IF p_scheduled_start_date IS NULL AND p_completion_state = 'not_started' THEN
    RETURN 'purchased';
  END IF;

  IF p_scheduled_start_date IS NOT NULL AND p_scheduled_start_date > CURRENT_DATE THEN
    RETURN 'scheduled';
  END IF;

  IF p_completion_state = 'in_progress' OR p_purchase_state IN ('owned_active', 'owned_completed', 'owned_archived') THEN
    RETURN 'active';
  END IF;

  RETURN 'purchased';
END;
$$;

UPDATE public.program_access
SET program_state = public.derive_program_state(
  owned_program,
  purchase_state,
  completion_state,
  scheduled_start_date,
  paused_at
)
WHERE program_state IS DISTINCT FROM public.derive_program_state(
  owned_program,
  purchase_state,
  completion_state,
  scheduled_start_date,
  paused_at
);

COMMIT;
