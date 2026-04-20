BEGIN;

-- Keep user-scoped read access, but make entitlement writes server-authoritative.
-- program_access should be mutated only by trusted backend paths (webhooks/jobs).
ALTER TABLE public.program_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can update their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can delete their own program access" ON public.program_access;

DROP POLICY IF EXISTS "Service role can insert program access" ON public.program_access;
DROP POLICY IF EXISTS "Service role can update program access" ON public.program_access;
DROP POLICY IF EXISTS "Service role can delete program access" ON public.program_access;

CREATE POLICY "Service role can insert program access"
  ON public.program_access
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update program access"
  ON public.program_access
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete program access"
  ON public.program_access
  FOR DELETE
  TO service_role
  USING (true);

COMMIT;
