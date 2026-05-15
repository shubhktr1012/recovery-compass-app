-- ============================================================
-- Recovery Compass — Phase 1 Content Model Migration
-- Source context:
--   documents/RC_System_Design_Spec.md
--   Sections 10.3, 11.1, 11.2, 12 (Phase 1)
--
-- Repo-specific compatibility notes:
-- - Reuses the existing public.update_updated_at_column() trigger helper.
-- - Keeps current app behavior compatible by mirroring:
--   * profiles.push_opt_in <-> profiles.notifications_enabled
--   * program_access.purchase_state/completion_state -> program_state
-- - Does not alter program_days JSONB structure here; Phase 1 content backfills
--   will annotate cards separately.
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 11.1 — NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug text NOT NULL UNIQUE
    REFERENCES public.programs (slug)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  template_slots jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(template_slots) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.program_templates
  IS 'Template-mode program card slots per RC System Design Spec §3.3 and §11.1.';
COMMENT ON COLUMN public.program_templates.template_slots
  IS 'Ordered slot definitions with placeholder-ready card content.';

ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'program_templates'
      AND policyname = 'Authenticated users can read program templates'
  ) THEN
    CREATE POLICY "Authenticated users can read program templates"
      ON public.program_templates
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DROP TRIGGER IF EXISTS trg_program_templates_updated_at ON public.program_templates;
CREATE TRIGGER trg_program_templates_updated_at
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.program_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug text NOT NULL
    REFERENCES public.programs (slug)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number >= 1),
  day_title text NOT NULL,
  phase text,
  day_goal text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(variables) = 'object'),
  overrides jsonb DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(overrides) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_progressions_program_day_unique UNIQUE (program_slug, day_number)
);

COMMENT ON TABLE public.program_progressions
  IS 'Per-day variable rows for template-mode programs per RC System Design Spec §3.4 and §11.1.';
COMMENT ON COLUMN public.program_progressions.variables
  IS 'Key-value interpolation data for template placeholders.';
COMMENT ON COLUMN public.program_progressions.overrides
  IS 'Per-day add/remove/replace slot overrides.';

CREATE INDEX IF NOT EXISTS idx_program_progressions_slug_day
  ON public.program_progressions (program_slug, day_number);

ALTER TABLE public.program_progressions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'program_progressions'
      AND policyname = 'Authenticated users can read program progressions'
  ) THEN
    CREATE POLICY "Authenticated users can read program progressions"
      ON public.program_progressions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DROP TRIGGER IF EXISTS trg_program_progressions_updated_at ON public.program_progressions;
CREATE TRIGGER trg_program_progressions_updated_at
  BEFORE UPDATE ON public.program_progressions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_day_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  program_slug text NOT NULL
    REFERENCES public.programs (slug)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number >= 1),
  day_state text NOT NULL CHECK (day_state IN ('completed', 'partial', 'skipped')),
  cards_completed integer NOT NULL DEFAULT 0 CHECK (cards_completed >= 0),
  cards_total integer NOT NULL DEFAULT 0 CHECK (cards_total >= 0),
  card_details jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(card_details) = 'array'),
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_day_states_user_program_day_unique UNIQUE (user_id, program_slug, day_number)
);

COMMENT ON TABLE public.user_day_states
  IS 'Per-user day quality history per RC System Design Spec §5.1 and §11.1.';
COMMENT ON COLUMN public.user_day_states.card_details
  IS 'Resolved card outcome records for the day.';

CREATE INDEX IF NOT EXISTS idx_user_day_states_user_program_day
  ON public.user_day_states (user_id, program_slug, day_number);

ALTER TABLE public.user_day_states ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_day_states'
      AND policyname = 'Users can read own day states'
  ) THEN
    CREATE POLICY "Users can read own day states"
      ON public.user_day_states
      FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_day_states'
      AND policyname = 'Users can insert own day states'
  ) THEN
    CREATE POLICY "Users can insert own day states"
      ON public.user_day_states
      FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_day_states'
      AND policyname = 'Users can update own day states'
  ) THEN
    CREATE POLICY "Users can update own day states"
      ON public.user_day_states
      FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

DROP TRIGGER IF EXISTS trg_user_day_states_updated_at ON public.user_day_states;
CREATE TRIGGER trg_user_day_states_updated_at
  BEFORE UPDATE ON public.user_day_states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  program_slug text
    REFERENCES public.programs (slug)
      ON UPDATE CASCADE
      ON DELETE SET NULL,
  day_number integer,
  card_id text,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(event_data) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_events
  IS 'Append-only user activity log per RC System Design Spec §10.3 and §11.1.';
COMMENT ON COLUMN public.user_events.event_data
  IS 'Opaque analytics payload for card/day/program events.';

CREATE INDEX IF NOT EXISTS idx_user_events_user_type_created
  ON public.user_events (user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_events_user_occurred
  ON public.user_events (user_id, occurred_at DESC);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_events'
      AND policyname = 'Users can read own events'
  ) THEN
    CREATE POLICY "Users can read own events"
      ON public.user_events
      FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_events'
      AND policyname = 'Users can insert own events'
  ) THEN
    CREATE POLICY "Users can insert own events"
      ON public.user_events
      FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

-- ============================================================
-- SECTION 11.2 — MODIFIED TABLES
-- ============================================================

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS content_mode text NOT NULL DEFAULT 'unique'
    CHECK (content_mode IN ('template', 'unique')),
  ADD COLUMN IF NOT EXISTS time_slots_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.programs.content_mode
  IS 'Spec §11.2: template vs unique card resolution mode.';
COMMENT ON COLUMN public.programs.time_slots_enabled
  IS 'Spec §11.2: feature flag for time-slot aware delivery.';

UPDATE public.programs
SET content_mode = 'unique'
WHERE content_mode IS DISTINCT FROM 'unique';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wake_time time NOT NULL DEFAULT '07:00:00',
  ADD COLUMN IF NOT EXISTS sleep_time time NOT NULL DEFAULT '23:00:00',
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consecutive_absent_days integer NOT NULL DEFAULT 0
    CHECK (consecutive_absent_days >= 0);

COMMENT ON COLUMN public.profiles.wake_time
  IS 'Spec §11.2 and §8.2: user-stated wake time.';
COMMENT ON COLUMN public.profiles.sleep_time
  IS 'Spec §11.2 and §8.2: user-stated sleep time.';
COMMENT ON COLUMN public.profiles.notifications_enabled
  IS 'Spec §11.2 and §8.2: mirrors whether the user granted push notifications.';
COMMENT ON COLUMN public.profiles.consecutive_absent_days
  IS 'Spec §11.2 and §6.5: inactivity counter for pause logic.';

UPDATE public.profiles
SET notifications_enabled = COALESCE(push_opt_in, notifications_enabled, false)
WHERE notifications_enabled IS DISTINCT FROM COALESCE(push_opt_in, notifications_enabled, false);

CREATE OR REPLACE FUNCTION public.sync_profile_notification_flags()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.notifications_enabled := COALESCE(NEW.notifications_enabled, NEW.push_opt_in, false);
    NEW.push_opt_in := COALESCE(NEW.push_opt_in, NEW.notifications_enabled, false);
    RETURN NEW;
  END IF;

  IF NEW.push_opt_in IS DISTINCT FROM OLD.push_opt_in
     AND NEW.notifications_enabled IS NOT DISTINCT FROM OLD.notifications_enabled THEN
    NEW.notifications_enabled := COALESCE(NEW.push_opt_in, false);
  ELSIF NEW.notifications_enabled IS DISTINCT FROM OLD.notifications_enabled
     AND NEW.push_opt_in IS NOT DISTINCT FROM OLD.push_opt_in THEN
    NEW.push_opt_in := COALESCE(NEW.notifications_enabled, false);
  ELSE
    NEW.notifications_enabled := COALESCE(NEW.notifications_enabled, NEW.push_opt_in, false);
    NEW.push_opt_in := COALESCE(NEW.push_opt_in, NEW.notifications_enabled, false);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_notification_flags ON public.profiles;
CREATE TRIGGER trg_profiles_sync_notification_flags
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_notification_flags();

ALTER TABLE public.program_access
  ADD COLUMN IF NOT EXISTS scheduled_start_date date,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS program_state text NOT NULL DEFAULT 'active';

ALTER TABLE public.program_access
  DROP CONSTRAINT IF EXISTS program_access_program_state_check;

ALTER TABLE public.program_access
  ADD CONSTRAINT program_access_program_state_check
  CHECK (program_state IN ('not_owned', 'purchased', 'scheduled', 'active', 'paused', 'completed'));

COMMENT ON COLUMN public.program_access.scheduled_start_date
  IS 'Spec §11.2 and §8.2: selected future program start date.';
COMMENT ON COLUMN public.program_access.paused_at
  IS 'Spec §11.2 and §6.5: timestamp set when auto-pause activates.';
COMMENT ON COLUMN public.program_access.program_state
  IS 'Spec §11.2 and §9.1 lifecycle state. Includes transitional not_owned for current app compatibility.';

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

  IF p_scheduled_start_date IS NOT NULL AND p_scheduled_start_date > CURRENT_DATE THEN
    RETURN 'scheduled';
  END IF;

  IF p_completion_state = 'in_progress' OR p_purchase_state IN ('owned_active', 'owned_completed', 'owned_archived') THEN
    RETURN 'active';
  END IF;

  RETURN 'purchased';
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_program_access_program_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.program_state := public.derive_program_state(
    NEW.owned_program,
    NEW.purchase_state,
    NEW.completion_state,
    NEW.scheduled_start_date,
    NEW.paused_at
  );
  RETURN NEW;
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

DROP TRIGGER IF EXISTS trg_program_access_sync_program_state ON public.program_access;
CREATE TRIGGER trg_program_access_sync_program_state
  BEFORE INSERT OR UPDATE ON public.program_access
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_program_access_program_state();

NOTIFY pgrst, 'reload schema';

COMMIT;
