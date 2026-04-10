-- Store prompt-scoped reflections from program day cards separately from the calendar journal.
CREATE TABLE IF NOT EXISTS public.program_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  card_index INTEGER NOT NULL CHECK (card_index >= 0),
  card_type TEXT NOT NULL DEFAULT 'journal',
  prompt TEXT NOT NULL,
  reflection TEXT NOT NULL CHECK (length(btrim(reflection)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_slug, day_number, card_index)
);

CREATE INDEX IF NOT EXISTS program_reflections_user_program_day_idx
  ON public.program_reflections (user_id, program_slug, day_number);

ALTER TABLE public.program_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own program reflections" ON public.program_reflections;
DROP POLICY IF EXISTS "Users can insert their own program reflections" ON public.program_reflections;
DROP POLICY IF EXISTS "Users can update their own program reflections" ON public.program_reflections;
DROP POLICY IF EXISTS "Users can delete their own program reflections" ON public.program_reflections;

CREATE POLICY "Users can view their own program reflections"
  ON public.program_reflections
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own program reflections"
  ON public.program_reflections
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own program reflections"
  ON public.program_reflections
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own program reflections"
  ON public.program_reflections
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS trg_program_reflections_updated_at ON public.program_reflections;

CREATE TRIGGER trg_program_reflections_updated_at
  BEFORE UPDATE ON public.program_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journal_entries_updated_at();
