BEGIN;

CREATE OR REPLACE FUNCTION public.acknowledge_program_queue_review(
  p_active_program text DEFAULT NULL
)
RETURNS TABLE (
  active_program text,
  queue_reviewed_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_program_id text := lower(trim(coalesce(p_active_program, '')));
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_program_id = '' THEN
    SELECT preferences.active_program
    INTO v_program_id
    FROM public.user_program_preferences AS preferences
    WHERE preferences.user_id = v_user_id;
  END IF;

  IF v_program_id = '' OR v_program_id IS NULL THEN
    SELECT access.owned_program
    INTO v_program_id
    FROM public.program_access AS access
    WHERE access.user_id = v_user_id
      AND access.owned_program IS NOT NULL
      AND access.purchase_state <> 'not_owned'
      AND access.completion_state <> 'completed'
      AND access.program_state IN ('active', 'scheduled', 'paused')
    ORDER BY
      CASE access.program_state
        WHEN 'active' THEN 0
        WHEN 'scheduled' THEN 1
        WHEN 'paused' THEN 2
        ELSE 3
      END,
      access.updated_at DESC,
      access.created_at DESC
    LIMIT 1;
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
    FROM public.program_access AS access
    WHERE access.user_id = v_user_id
      AND access.owned_program = v_program_id
      AND access.purchase_state <> 'not_owned'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Program is not owned: %', v_program_id;
  END IF;

  INSERT INTO public.user_program_preferences (
    user_id,
    active_program,
    queue_reviewed_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_program_id,
    v_now,
    v_now,
    v_now
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    active_program = EXCLUDED.active_program,
    queue_reviewed_at = EXCLUDED.queue_reviewed_at,
    updated_at = EXCLUDED.updated_at;

  RETURN QUERY
  SELECT
    preferences.active_program,
    preferences.queue_reviewed_at,
    preferences.updated_at
  FROM public.user_program_preferences AS preferences
  WHERE preferences.user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_program_queue_review(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_program_queue_review(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
