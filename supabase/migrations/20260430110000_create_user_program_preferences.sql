BEGIN;

CREATE TABLE IF NOT EXISTS public.user_program_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_program TEXT NOT NULL CHECK (
    active_program IN (
      'six_day_reset',
      'ninety_day_transform',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_program_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own program preferences"
  ON public.user_program_preferences;
CREATE POLICY "Users can view their own program preferences"
  ON public.user_program_preferences
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS trg_user_program_preferences_updated_at
  ON public.user_program_preferences;
CREATE TRIGGER trg_user_program_preferences_updated_at
  BEFORE UPDATE ON public.user_program_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.select_active_program(p_program_id TEXT)
RETURNS TABLE (
  active_program TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_program_id TEXT := lower(trim(COALESCE(p_program_id, '')));
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.program_access
    WHERE user_id = v_user_id
      AND owned_program = v_program_id
      AND purchase_state IN ('owned_active', 'owned_completed', 'owned_archived')
  ) THEN
    RAISE EXCEPTION 'Program is not owned: %', v_program_id;
  END IF;

  INSERT INTO public.user_program_preferences (
    user_id,
    active_program,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_program_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    active_program = EXCLUDED.active_program,
    updated_at = NOW();

  RETURN QUERY
  SELECT
    preferences.active_program,
    preferences.updated_at
  FROM public.user_program_preferences AS preferences
  WHERE preferences.user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.select_active_program(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_active_program(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
