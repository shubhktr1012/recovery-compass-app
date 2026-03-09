CREATE TABLE IF NOT EXISTS public.program_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owned_program TEXT CHECK (owned_program IN ('six_day_reset', 'ninety_day_transform')),
  purchase_state TEXT NOT NULL DEFAULT 'not_owned' CHECK (purchase_state IN ('not_owned', 'owned_active', 'owned_completed', 'owned_archived')),
  completion_state TEXT NOT NULL DEFAULT 'not_started' CHECK (completion_state IN ('not_started', 'in_progress', 'completed', 'archived')),
  current_day INTEGER,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  revenuecat_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.program_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can insert their own program access" ON public.program_access;
DROP POLICY IF EXISTS "Users can update their own program access" ON public.program_access;

CREATE POLICY "Users can view their own program access"
  ON public.program_access
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own program access"
  ON public.program_access
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own program access"
  ON public.program_access
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
