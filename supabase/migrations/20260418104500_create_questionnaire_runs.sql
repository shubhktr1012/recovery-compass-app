BEGIN;

-- Append-only history of completed questionnaire runs.
-- The live app still reads questionnaire state from profiles.questionnaire_answers
-- for backward compatibility, while this table becomes the long-term audit/history layer.

CREATE TABLE public.questionnaire_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  questionnaire_version TEXT NOT NULL,
  journey_key TEXT NOT NULL,
  recommended_program TEXT NOT NULL,
  primary_concern_label TEXT,
  questionnaire_answers JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX questionnaire_runs_user_id_created_at_idx
  ON public.questionnaire_runs (user_id, created_at DESC);

CREATE INDEX questionnaire_runs_journey_key_created_at_idx
  ON public.questionnaire_runs (journey_key, created_at DESC);

ALTER TABLE public.questionnaire_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own questionnaire runs"
ON public.questionnaire_runs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own questionnaire runs"
ON public.questionnaire_runs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

COMMIT;
