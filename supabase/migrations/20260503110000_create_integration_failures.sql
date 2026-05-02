BEGIN;

CREATE TABLE IF NOT EXISTS public.integration_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  operation text NOT NULL,
  severity text NOT NULL DEFAULT 'error'
    CHECK (severity IN ('warning', 'error')),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  external_event_id text NULL,
  external_transaction_id text NULL,
  error_message text NOT NULL,
  metadata jsonb NULL,
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_failures_source_operation
  ON public.integration_failures(source, operation, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_failures_user_id
  ON public.integration_failures(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_failures_external_event
  ON public.integration_failures(external_event_id);

CREATE TRIGGER set_integration_failures_updated_at
  BEFORE UPDATE ON public.integration_failures
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integration_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to integration_failures"
  ON public.integration_failures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
