BEGIN;

CREATE TABLE IF NOT EXISTS public.app_web_handoff_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  next_path TEXT NOT NULL DEFAULT '/diet-plan',
  platform TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 seconds'),
  consumed_at TIMESTAMPTZ,
  CONSTRAINT app_web_handoff_tokens_hash_format
    CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT app_web_handoff_tokens_next_path_check
    CHECK (next_path IN ('/', '/checkout', '/diet-plan', '/program-finder')),
  CONSTRAINT app_web_handoff_tokens_expiry_check
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_app_web_handoff_tokens_user_created
  ON public.app_web_handoff_tokens (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_web_handoff_tokens_unconsumed_expiry
  ON public.app_web_handoff_tokens (expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.app_web_handoff_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_web_handoff_tokens FROM PUBLIC;
REVOKE ALL ON TABLE public.app_web_handoff_tokens FROM anon;
REVOKE ALL ON TABLE public.app_web_handoff_tokens FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_web_handoff_tokens TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
