-- Create daily journal entries for authenticated users.
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT (timezone('utc', now()))::date,
  mood TEXT,
  cravings_level SMALLINT CHECK (cravings_level BETWEEN 1 AND 10),
  reflection TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS journal_entries_user_id_created_at_idx
  ON public.journal_entries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS journal_entries_user_id_entry_date_idx
  ON public.journal_entries (user_id, entry_date DESC);

CREATE OR REPLACE FUNCTION public.update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_entries_updated_at ON public.journal_entries;

CREATE TRIGGER trg_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journal_entries_updated_at();

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.journal_entries;

CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON public.journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
