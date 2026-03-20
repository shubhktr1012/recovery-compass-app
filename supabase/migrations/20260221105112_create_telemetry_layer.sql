ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS trigger_context TEXT,
ADD COLUMN IF NOT EXISTS physical_symptoms TEXT[] DEFAULT '{}';

ALTER TABLE public.program_progress
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_completed BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  craving_level_before SMALLINT CHECK (craving_level_before BETWEEN 1 AND 10),
  craving_level_after SMALLINT CHECK (craving_level_after BETWEEN 1 AND 10),
  tool_used TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_time TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.routine_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.user_routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE (routine_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_sos_events_user_id on public.sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_user_id on public.user_routines(user_id);
CREATE INDEX idx_routine_checkins_user_id on public.routine_checkins(user_id);

ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sos logs" ON public.sos_events;
CREATE POLICY "Users can view their own sos logs" ON public.sos_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sos logs" ON public.sos_events;
CREATE POLICY "Users can insert their own sos logs" ON public.sos_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own routines" ON public.user_routines;
CREATE POLICY "Users can manage their own routines" ON public.user_routines FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own routine checkins" ON public.routine_checkins;
CREATE POLICY "Users can manage their own routine checkins" ON public.routine_checkins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);;
