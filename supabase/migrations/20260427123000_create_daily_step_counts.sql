CREATE TABLE IF NOT EXISTS public.daily_step_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  steps INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0),
  source TEXT NOT NULL CHECK (
    source IN (
      'ios_core_motion',
      'android_health_connect',
      'android_pedometer',
      'manual',
      'cached'
    )
  ),
  provider_status TEXT NOT NULL DEFAULT 'ready',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, local_date)
);

CREATE INDEX IF NOT EXISTS daily_step_counts_user_date_idx
  ON public.daily_step_counts (user_id, local_date DESC);

ALTER TABLE public.daily_step_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own daily step counts"
  ON public.daily_step_counts;
CREATE POLICY "Users can view their own daily step counts"
  ON public.daily_step_counts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily step counts"
  ON public.daily_step_counts;
CREATE POLICY "Users can insert their own daily step counts"
  ON public.daily_step_counts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily step counts"
  ON public.daily_step_counts;
CREATE POLICY "Users can update their own daily step counts"
  ON public.daily_step_counts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_daily_step_counts_updated_at
  ON public.daily_step_counts;
CREATE TRIGGER trg_daily_step_counts_updated_at
  BEFORE UPDATE ON public.daily_step_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
