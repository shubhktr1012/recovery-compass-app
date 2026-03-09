-- Create programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  requires_audio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the two core programs
INSERT INTO public.programs (title, duration_days, description, requires_audio) VALUES
  ('6-Day Control', 6, 'A text-based, intensive 6-day program to break the initial cycle.', false),
  ('90-Day Quit', 90, 'A comprehensive 90-day program with daily audio-guided exercises to build long-term habits.', true);

-- Create program_days table (The Content CMS)
CREATE TABLE public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  audio_url TEXT, -- NULL for 6-Day Control
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, day_number)
);

-- Row Level Security (RLS)
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are viewable by everyone" ON public.programs FOR SELECT USING (true);

ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Program days are viewable by everyone" ON public.program_days FOR SELECT USING (true);


-- Alter existing program_progress table instead of replacing it
-- Notice: Current program_progress has `program_id` as TEXT, let's keep it that way for backwards compatibility if needed, OR we can cast it if we know it's empty. Since it tracks `day_id`, we can add `current_day` or array of `completed_days` for the new feature scope.

CREATE TABLE IF NOT EXISTS public.program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  day_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNLOCKED',
  content_completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, program_id, day_id)
);

ALTER TABLE public.program_progress
ADD COLUMN IF NOT EXISTS current_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_days INTEGER[] DEFAULT '{}';

-- Optional casting if program_id should really be UUID linked to our new table (only safe if empty or already valid UUIDs, but we will add a fallback just in case or skip strict FK for now to be completely safe)
-- We'll just rely on the existing TEXT program_id or alter its type if sure. Adding a new `program_uuid` column is safer if there's data.
ALTER TABLE public.program_progress
ADD COLUMN IF NOT EXISTS program_uuid UUID REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.program_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.program_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.program_progress;

CREATE POLICY "Users can view their own progress"
  ON public.program_progress
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.program_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.program_progress
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
