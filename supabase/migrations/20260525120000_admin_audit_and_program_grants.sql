BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'ops', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_unique
  ON public.admin_users (lower(email));

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_users FROM anon;
REVOKE ALL ON TABLE public.admin_users FROM authenticated;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  admin_email text NOT NULL,
  admin_role text NOT NULL CHECK (admin_role IN ('owner', 'ops', 'viewer')),
  action text NOT NULL,
  target_user_id uuid,
  target_email text,
  target_program text,
  reason text,
  evidence text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_audit_logs FROM anon;
REVOKE ALL ON TABLE public.admin_audit_logs FROM authenticated;

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_email_idx
  ON public.admin_audit_logs (lower(admin_email), created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_target_user_idx
  ON public.admin_audit_logs (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_action_idx
  ON public.admin_audit_logs (action, created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_grant_program_access(
  p_target_user_id uuid,
  p_program_id text,
  p_admin_user_id uuid,
  p_admin_email text,
  p_admin_role text,
  p_reason text,
  p_evidence text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  user_id uuid,
  target_email text,
  owned_program text,
  purchase_state text,
  completion_state text,
  program_state text,
  current_day integer,
  priority_rank integer,
  already_owned boolean,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_id text := lower(trim(coalesce(p_program_id, '')));
  v_admin_email text := lower(trim(coalesce(p_admin_email, '')));
  v_admin_role text := lower(trim(coalesce(p_admin_role, '')));
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_evidence text := nullif(trim(coalesce(p_evidence, '')), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_profile_email text;
  v_existing public.program_access%rowtype;
  v_already_owned boolean := false;
BEGIN
  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id is required';
  END IF;

  IF v_admin_email = '' THEN
    RAISE EXCEPTION 'admin_email is required';
  END IF;

  IF v_admin_role NOT IN ('owner', 'ops') THEN
    RAISE EXCEPTION 'Admin role cannot grant programs: %', v_admin_role;
  END IF;

  IF v_reason IS NULL OR length(v_reason) < 3 THEN
    RAISE EXCEPTION 'reason is required';
  END IF;

  IF v_evidence IS NULL OR length(v_evidence) < 3 THEN
    RAISE EXCEPTION 'evidence is required';
  END IF;

  IF v_program_id = '' THEN
    RAISE EXCEPTION 'program_id is required';
  END IF;

  SELECT profile.email
  INTO v_profile_email
  FROM public.profiles AS profile
  WHERE profile.id = p_target_user_id
  LIMIT 1;

  IF v_profile_email IS NULL THEN
    RAISE EXCEPTION 'Profile not found: %', p_target_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.programs AS program
    WHERE program.slug = v_program_id
      AND program.is_active IS NOT FALSE
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Unknown program_id: %', v_program_id;
  END IF;

  SELECT access.*
  INTO v_existing
  FROM public.program_access AS access
  WHERE access.user_id = p_target_user_id
    AND access.owned_program = v_program_id
  LIMIT 1;

  v_already_owned := v_existing.user_id IS NOT NULL
    AND v_existing.purchase_state <> 'not_owned';

  IF v_existing.user_id IS NULL THEN
    -- Not-started access with no scheduled date derives to program_state='purchased',
    -- so manual grants queue/setup access without creating a second active journey.
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
      p_target_user_id,
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
    );
  ELSIF v_existing.purchase_state = 'not_owned' THEN
    -- Preserve the same purchased/setup behavior for users who had a legacy
    -- placeholder row but no owned entitlement.
    UPDATE public.program_access AS access
    SET
      purchase_state = 'owned_active',
      completion_state = 'not_started',
      current_day = NULL,
      completed_at = NULL,
      archived_at = NULL,
      scheduled_start_date = NULL,
      paused_at = NULL,
      priority_rank = NULL,
      updated_at = now()
    WHERE access.user_id = p_target_user_id
      AND access.owned_program = v_program_id;
  ELSE
    UPDATE public.program_access AS access
    SET
      purchase_state = CASE
        WHEN access.completion_state = 'completed' THEN 'owned_completed'
        ELSE 'owned_active'
      END,
      updated_at = now()
    WHERE access.user_id = p_target_user_id
      AND access.owned_program = v_program_id;
  END IF;

  PERFORM public.normalize_owned_program_priority_queue(p_target_user_id);

  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    admin_email,
    admin_role,
    action,
    target_user_id,
    target_email,
    target_program,
    reason,
    evidence,
    metadata
  )
  VALUES (
    p_admin_user_id,
    v_admin_email,
    v_admin_role,
    'program_granted',
    p_target_user_id,
    v_profile_email,
    v_program_id,
    v_reason,
    v_evidence,
    v_metadata || jsonb_build_object('already_owned', v_already_owned)
  );

  RETURN QUERY
  SELECT
    access.user_id,
    v_profile_email AS target_email,
    access.owned_program,
    access.purchase_state,
    access.completion_state,
    access.program_state,
    access.current_day,
    access.priority_rank,
    v_already_owned,
    access.updated_at
  FROM public.program_access AS access
  WHERE access.user_id = p_target_user_id
    AND access.owned_program = v_program_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_program_access(uuid, text, uuid, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_grant_program_access(uuid, text, uuid, text, text, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.admin_grant_program_access(uuid, text, uuid, text, text, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_program_access(uuid, text, uuid, text, text, text, text, jsonb) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
