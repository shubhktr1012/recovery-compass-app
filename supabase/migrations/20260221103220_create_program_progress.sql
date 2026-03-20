ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_program TEXT DEFAULT '6-DAY' CHECK (active_program IN ('6-DAY', '90-DAY'));

CREATE TABLE IF NOT EXISTS public.program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL CHECK (program_id IN ('6-DAY', '90-DAY')),
  day_id INTEGER NOT NULL CHECK (day_id >= 1 AND day_id <= 90),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, day_id)
);

CREATE TABLE IF NOT EXISTS public.relapse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slip_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_progress_user_id on public.program_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_relapse_logs_user_id on public.relapse_logs(user_id);

ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relapse_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.program_progress;
CREATE POLICY "Users can view their own progress"
  ON public.program_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.program_progress;
CREATE POLICY "Users can insert their own progress"
  ON public.program_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own progress" ON public.program_progress;
CREATE POLICY "Users can delete their own progress"
  ON public.program_progress FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own relapse logs" ON public.relapse_logs;
CREATE POLICY "Users can view their own relapse logs"
  ON public.relapse_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own relapse logs" ON public.relapse_logs;
CREATE POLICY "Users can insert their own relapse logs"
  ON public.relapse_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_program_progress_updated_at ON public.program_progress;
CREATE TRIGGER trg_program_progress_updated_at
  BEFORE UPDATE ON public.program_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journal_entries_updated_at();
;
