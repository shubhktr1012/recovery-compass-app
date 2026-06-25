BEGIN;

CREATE TABLE IF NOT EXISTS public.program_swap_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_program text NOT NULL REFERENCES public.programs(slug),
  to_program text NOT NULL REFERENCES public.programs(slug),
  reason text NOT NULL,
  previous_active_day integer,
  previous_queue jsonb NOT NULL DEFAULT '[]'::jsonb,
  new_queue jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.program_swap_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS program_swap_events_user_created_idx
  ON public.program_swap_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS program_swap_events_from_to_idx
  ON public.program_swap_events (from_program, to_program, created_at DESC);

DROP POLICY IF EXISTS "Users can read own program swap events" ON public.program_swap_events;
CREATE POLICY "Users can read own program swap events"
  ON public.program_swap_events
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.program_swap_events FROM PUBLIC;
GRANT SELECT ON public.program_swap_events TO authenticated;
GRANT ALL ON public.program_swap_events TO service_role;

CREATE OR REPLACE FUNCTION public.swap_active_program(
  p_target_program text,
  p_reason text,
  p_scheduled_start_date date DEFAULT NULL
)
RETURNS TABLE (
  active_program text,
  previous_program text,
  active_program_state text,
  previous_program_state text,
  cooldown_until timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_target_program text := lower(trim(coalesce(p_target_program, '')));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_now timestamptz := now();
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_last_swap_at timestamptz;
  v_cooldown_until timestamptz;
  v_current public.program_access%rowtype;
  v_target public.program_access%rowtype;
  v_previous_day integer;
  v_target_day integer;
  v_target_started_before boolean;
  v_target_start_date date;
  v_target_started_at timestamptz;
  v_previous_queue jsonb;
  v_new_queue jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_target_program = ''
    OR NOT EXISTS (
      SELECT 1
      FROM public.programs AS program
      WHERE program.slug = v_target_program
      LIMIT 1
    ) THEN
    RAISE EXCEPTION 'Unknown program_id: %', v_target_program;
  END IF;

  IF char_length(v_reason) < 10 THEN
    RAISE EXCEPTION 'Please enter at least 10 characters explaining why you want to switch.';
  END IF;

  IF char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'Switch reason must be 500 characters or fewer.';
  END IF;

  SELECT events.created_at
  INTO v_last_swap_at
  FROM public.program_swap_events AS events
  WHERE events.user_id = v_user_id
  ORDER BY events.created_at DESC
  LIMIT 1;

  IF v_last_swap_at IS NOT NULL AND v_last_swap_at > v_now - interval '7 days' THEN
    v_cooldown_until := v_last_swap_at + interval '7 days';
    RAISE EXCEPTION 'Program switching is available again after %', v_cooldown_until;
  END IF;

  SELECT access.*
  INTO v_current
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program IS NOT NULL
    AND access.purchase_state = 'owned_active'
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
  LIMIT 1
  FOR UPDATE;

  IF v_current.id IS NULL THEN
    RAISE EXCEPTION 'No active program is available to switch from.';
  END IF;

  IF v_current.owned_program = v_target_program THEN
    RAISE EXCEPTION 'Target program is already active.';
  END IF;

  SELECT access.*
  INTO v_target
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program = v_target_program
    AND access.purchase_state = 'owned_active'
    AND access.completion_state <> 'completed'
    AND access.completed_at IS NULL
    AND access.archived_at IS NULL
  LIMIT 1
  FOR UPDATE;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Program is not owned: %', v_target_program;
  END IF;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'program', access.owned_program,
      'priorityRank', access.priority_rank,
      'programState', access.program_state,
      'currentDay', access.current_day
    )
    ORDER BY access.priority_rank ASC NULLS LAST, access.updated_at ASC, access.created_at ASC
  ), '[]'::jsonb)
  INTO v_previous_queue
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program IS NOT NULL
    AND access.purchase_state <> 'not_owned'
    AND access.completion_state <> 'completed'
    AND access.program_state = 'purchased';

  v_previous_day := greatest(1, coalesce(v_current.current_day, 1));
  v_target_day := greatest(1, coalesce(v_target.current_day, 1));
  v_target_started_before :=
    coalesce(v_target.started_at IS NOT NULL, false)
    OR coalesce(v_target.scheduled_start_date IS NOT NULL, false)
    OR coalesce(v_target.current_day, 1) > 1
    OR v_target.completion_state = 'in_progress';

  IF NOT v_target_started_before THEN
    IF p_scheduled_start_date IS NULL THEN
      RAISE EXCEPTION 'scheduled_start_date is required for a program that has not started.';
    END IF;

    IF p_scheduled_start_date < v_today - 1 OR p_scheduled_start_date > v_today + 2 THEN
      RAISE EXCEPTION 'scheduled_start_date must be today or tomorrow.';
    END IF;

    v_target_start_date := p_scheduled_start_date;
    v_target_started_at := make_timestamptz(
      extract(year from v_target_start_date)::int,
      extract(month from v_target_start_date)::int,
      extract(day from v_target_start_date)::int,
      5,
      0,
      0,
      'Asia/Kolkata'
    );
  ELSE
    v_target_start_date := v_today;
    v_target_started_at := make_timestamptz(
      extract(year from v_today)::int,
      extract(month from v_today)::int,
      extract(day from v_today)::int,
      5,
      0,
      0,
      'Asia/Kolkata'
    ) - ((v_target_day - 1) * interval '1 day');
  END IF;

  UPDATE public.program_access AS access
  SET
    priority_rank = access.priority_rank + 1,
    updated_at = v_now
  WHERE access.user_id = v_user_id
    AND access.owned_program IS NOT NULL
    AND access.owned_program NOT IN (v_current.owned_program, v_target_program)
    AND access.purchase_state <> 'not_owned'
    AND access.completion_state <> 'completed'
    AND access.program_state = 'purchased'
    AND access.priority_rank IS NOT NULL;

  UPDATE public.program_access AS access
  SET
    current_day = v_previous_day,
    scheduled_start_date = NULL,
    paused_at = NULL,
    program_state = 'purchased',
    priority_rank = 0,
    updated_at = v_now
  WHERE access.id = v_current.id;

  UPDATE public.program_access AS access
  SET
    current_day = v_target_day,
    scheduled_start_date = v_target_start_date,
    started_at = v_target_started_at,
    paused_at = NULL,
    priority_rank = NULL,
    updated_at = v_now
  WHERE access.id = v_target.id;

  PERFORM public.normalize_owned_program_priority_queue(v_user_id);

  INSERT INTO public.user_program_preferences (
    user_id,
    active_program,
    queue_reviewed_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_target_program,
    v_now,
    v_now,
    v_now
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    active_program = EXCLUDED.active_program,
    queue_reviewed_at = EXCLUDED.queue_reviewed_at,
    updated_at = EXCLUDED.updated_at;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'program', access.owned_program,
      'priorityRank', access.priority_rank,
      'programState', access.program_state,
      'currentDay', access.current_day
    )
    ORDER BY access.priority_rank ASC NULLS LAST, access.updated_at ASC, access.created_at ASC
  ), '[]'::jsonb)
  INTO v_new_queue
  FROM public.program_access AS access
  WHERE access.user_id = v_user_id
    AND access.owned_program IS NOT NULL
    AND access.purchase_state <> 'not_owned'
    AND access.completion_state <> 'completed'
    AND access.program_state = 'purchased';

  INSERT INTO public.program_swap_events (
    user_id,
    from_program,
    to_program,
    reason,
    previous_active_day,
    previous_queue,
    new_queue,
    metadata,
    created_at
  )
  VALUES (
    v_user_id,
    v_current.owned_program,
    v_target_program,
    v_reason,
    v_previous_day,
    v_previous_queue,
    v_new_queue,
    jsonb_build_object(
      'targetStartedBefore', v_target_started_before,
      'targetStartDate', v_target_start_date
    ),
    v_now
  );

  RETURN QUERY
  SELECT
    target_access.owned_program,
    v_current.owned_program,
    target_access.program_state,
    previous_access.program_state,
    v_now + interval '7 days',
    target_access.updated_at
  FROM public.program_access AS target_access
  CROSS JOIN public.program_access AS previous_access
  WHERE target_access.id = v_target.id
    AND previous_access.id = v_current.id;
END;
$$;

REVOKE ALL ON FUNCTION public.swap_active_program(text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swap_active_program(text, text, date) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
