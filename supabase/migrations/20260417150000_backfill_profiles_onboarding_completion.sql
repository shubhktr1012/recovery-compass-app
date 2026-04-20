-- Backfill onboarding completion state for legacy completed questionnaire rows.
-- This is intentionally conservative:
-- - only rows with questionnaire answers plus a strong completion signal are included
-- - partial review/test rows without completion evidence are excluded

UPDATE public.profiles
SET
  onboarding_complete = TRUE,
  questionnaire_completed = TRUE,
  onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at)
WHERE onboarding_complete IS DISTINCT FROM TRUE
  AND questionnaire_answers IS NOT NULL
  AND (
    recommended_program IS NOT NULL
    OR onboarding_completed_at IS NOT NULL
    OR active_program IS NOT NULL
  );
