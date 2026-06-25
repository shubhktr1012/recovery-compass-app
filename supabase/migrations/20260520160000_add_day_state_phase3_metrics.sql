ALTER TABLE public.user_day_states
  ADD COLUMN IF NOT EXISTS cards_opened integer NOT NULL DEFAULT 0 CHECK (cards_opened >= 0),
  ADD COLUMN IF NOT EXISTS completion_percentage numeric(5,2) NOT NULL DEFAULT 0 CHECK (
    completion_percentage >= 0
    AND completion_percentage <= 100
  );

COMMENT ON COLUMN public.user_day_states.cards_opened
  IS 'Number of day cards the user reached before finalization. Engagement signal only; not used for user-facing score.';

COMMENT ON COLUMN public.user_day_states.completion_percentage
  IS 'Finalized day score: cards_completed / cards_total * 100.';

UPDATE public.user_day_states
SET
  cards_opened = GREATEST(cards_opened, cards_completed),
  completion_percentage = CASE
    WHEN cards_total > 0 THEN ROUND((cards_completed::numeric / cards_total::numeric) * 100, 2)
    ELSE 0
  END;
