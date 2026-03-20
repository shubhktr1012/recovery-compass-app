CREATE TABLE IF NOT EXISTS public.client_error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_error_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own client error events" ON public.client_error_events;
DROP POLICY IF EXISTS "Users can insert their own client error events" ON public.client_error_events;

CREATE POLICY "Users can view their own client error events"
  ON public.client_error_events
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own client error events"
  ON public.client_error_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
