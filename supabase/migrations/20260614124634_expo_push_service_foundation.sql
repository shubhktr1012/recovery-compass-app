CREATE TABLE IF NOT EXISTS public.push_device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  platform text NOT NULL DEFAULT 'unknown',
  project_id text,
  app_version text,
  app_build_number text,
  device_name text,
  device_model text,
  is_disabled boolean NOT NULL DEFAULT false,
  disabled_at timestamptz,
  disabled_reason text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_device_tokens_user_token_unique UNIQUE (user_id, expo_push_token),
  CONSTRAINT push_device_tokens_platform_check
    CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  CONSTRAINT push_device_tokens_disabled_state_check
    CHECK (
      (is_disabled = false AND disabled_at IS NULL)
      OR (is_disabled = true AND disabled_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS push_device_tokens_user_active_idx
  ON public.push_device_tokens (user_id, last_seen_at DESC)
  WHERE is_disabled = false;

CREATE INDEX IF NOT EXISTS push_device_tokens_token_idx
  ON public.push_device_tokens (expo_push_token);

DROP TRIGGER IF EXISTS trg_push_device_tokens_updated_at
  ON public.push_device_tokens;
CREATE TRIGGER trg_push_device_tokens_updated_at
  BEFORE UPDATE ON public.push_device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.push_device_tokens ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.push_device_tokens TO authenticated;

DROP POLICY IF EXISTS "Users can read own push device tokens"
  ON public.push_device_tokens;
CREATE POLICY "Users can read own push device tokens"
  ON public.push_device_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.push_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token_id uuid REFERENCES public.push_device_tokens(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ticket_id text,
  ticket_status text NOT NULL DEFAULT 'pending',
  ticket_message text,
  ticket_details jsonb,
  receipt_status text,
  receipt_message text,
  receipt_details jsonb,
  sent_at timestamptz,
  receipt_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_notification_deliveries_event_type_check
    CHECK (
      event_type IN (
        'admin_test_push',
        'diet_plan_ready',
        'free_detox_daily_fallback',
        'program_reengagement_fallback'
      )
    ),
  CONSTRAINT push_notification_deliveries_ticket_status_check
    CHECK (ticket_status IN ('pending', 'ok', 'error', 'skipped')),
  CONSTRAINT push_notification_deliveries_receipt_status_check
    CHECK (
      receipt_status IS NULL
      OR receipt_status IN ('ok', 'error', 'missing')
    ),
  CONSTRAINT push_notification_deliveries_event_token_unique
    UNIQUE (event_key, token_id)
);

CREATE INDEX IF NOT EXISTS push_notification_deliveries_user_created_idx
  ON public.push_notification_deliveries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS push_notification_deliveries_receipt_pending_idx
  ON public.push_notification_deliveries (sent_at ASC)
  WHERE ticket_status = 'ok'
    AND ticket_id IS NOT NULL
    AND receipt_checked_at IS NULL;

DROP TRIGGER IF EXISTS trg_push_notification_deliveries_updated_at
  ON public.push_notification_deliveries;
CREATE TRIGGER trg_push_notification_deliveries_updated_at
  BEFORE UPDATE ON public.push_notification_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.push_notification_deliveries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.push_device_tokens IS
  'Per-device Expo push tokens. App users can read their own token state; Edge Functions upsert and disable tokens with the service role.';

COMMENT ON TABLE public.push_notification_deliveries IS
  'Expo Push Service delivery log with ticket and receipt state for idempotent server push sends.';
