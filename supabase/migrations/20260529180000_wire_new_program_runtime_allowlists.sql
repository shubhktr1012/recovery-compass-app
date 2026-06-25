BEGIN;

-- Allow the two next-binary programs everywhere program slugs are constrained.
-- The old smoking programs stay valid so existing owners can continue or review them.
ALTER TABLE public.program_access
  DROP CONSTRAINT IF EXISTS program_access_owned_program_check;
ALTER TABLE public.program_access
  ADD CONSTRAINT program_access_owned_program_check
  CHECK (owned_program IS NULL OR owned_program IN (
    'six_day_reset',
    'ninety_day_transform',
    'smoking_alcohol_quit',
    'sleep_disorder_reset',
    'energy_vitality',
    'age_reversal',
    'male_sexual_health',
    'gut_health_reset'
  ));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'active_program'
  ) THEN
    ALTER TABLE public.profiles
      DROP CONSTRAINT IF EXISTS profiles_active_program_check;
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_active_program_check
      CHECK (
        active_program IS NULL
        OR active_program IN (
          'six_day_reset',
          'ninety_day_transform',
          'smoking_alcohol_quit',
          'sleep_disorder_reset',
          'energy_vitality',
          'age_reversal',
          'male_sexual_health',
          'gut_health_reset',
          '6-DAY'
        )
      );
  END IF;
END $$;

ALTER TABLE public.user_program_preferences
  DROP CONSTRAINT IF EXISTS user_program_preferences_active_program_check;
ALTER TABLE public.user_program_preferences
  ADD CONSTRAINT user_program_preferences_active_program_check
  CHECK (
    active_program IN (
      'six_day_reset',
      'ninety_day_transform',
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset'
    )
  );

ALTER TABLE public.program_progress
  DROP CONSTRAINT IF EXISTS program_progress_program_id_check;
ALTER TABLE public.program_progress
  ADD CONSTRAINT program_progress_program_id_check
  CHECK (
    program_id IN (
      'six_day_reset',
      'ninety_day_transform',
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset'
    )
  );

ALTER TABLE public.notification_templates
  DROP CONSTRAINT IF EXISTS notification_templates_program_slug_check;
ALTER TABLE public.notification_templates
  ADD CONSTRAINT notification_templates_program_slug_check
  CHECK (
    program_slug = 'global'
    OR program_slug IN (
      'six_day_reset',
      'ninety_day_transform',
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset'
    )
  );

ALTER TABLE public.notification_template_variants
  DROP CONSTRAINT IF EXISTS notification_template_variants_program_slug_check;
ALTER TABLE public.notification_template_variants
  ADD CONSTRAINT notification_template_variants_program_slug_check
  CHECK (
    program_slug = 'global'
    OR program_slug IN (
      'six_day_reset',
      'ninety_day_transform',
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset'
    )
  );

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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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
    IF NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

  IF v_program_id = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_program_id
      LIMIT 1
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

REVOKE ALL ON FUNCTION public.select_active_program(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_active_program(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.reorder_owned_program_queue(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_owned_program_queue(text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.configure_program_start(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configure_program_start(text, date) TO authenticated;

REVOKE ALL ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_owned_program_purchase(uuid, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_owned_program_purchase(text) TO authenticated;

REVOKE ALL ON FUNCTION public.acknowledge_program_queue_review(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_program_queue_review(text) TO authenticated;

REVOKE ALL ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resume_program_from_pause(text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_program_from_pause(text, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
