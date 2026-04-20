BEGIN;

-- Backfill historical completed questionnaire snapshots into questionnaire_runs.
-- This is intentionally conservative:
-- - only completed profiles rows are considered
-- - draft questionnaire payloads are excluded
-- - duplicate inserts are skipped if a matching history row already exists

WITH candidate_runs AS (
  SELECT
    p.id AS user_id,
    CASE
      WHEN p.questionnaire_answers ->> 'path' = 'guided_recommendation' THEN 'guided_recommendation'
      ELSE 'self_select'
    END AS source,
    COALESCE(p.questionnaire_answers ->> 'version', 'onboarding_redesign_v1') AS questionnaire_version,
    p.questionnaire_answers ->> 'journey' AS journey_key,
    COALESCE(p.recommended_program, p.questionnaire_answers ->> 'recommendedProgram') AS recommended_program,
    COALESCE(orx.root_cause, p.questionnaire_answers ->> 'mainIssue') AS primary_concern_label,
    p.questionnaire_answers AS questionnaire_answers,
    COALESCE(p.onboarding_completed_at, p.updated_at, NOW()) AS completed_at
  FROM public.profiles p
  LEFT JOIN public.onboarding_responses orx
    ON orx.user_id = p.id
  WHERE p.onboarding_complete IS TRUE
    AND p.questionnaire_answers IS NOT NULL
    AND COALESCE(p.questionnaire_answers ->> 'status', '') <> 'draft'
    AND COALESCE(p.questionnaire_answers ->> 'version', '') <> 'onboarding_redesign_v1_draft'
    AND COALESCE(p.questionnaire_answers ->> 'journey', '') <> ''
    AND COALESCE(p.recommended_program, p.questionnaire_answers ->> 'recommendedProgram', '') <> ''
)
INSERT INTO public.questionnaire_runs (
  user_id,
  source,
  questionnaire_version,
  journey_key,
  recommended_program,
  primary_concern_label,
  questionnaire_answers,
  completed_at,
  created_at,
  updated_at
)
SELECT
  c.user_id,
  c.source,
  c.questionnaire_version,
  c.journey_key,
  c.recommended_program,
  c.primary_concern_label,
  c.questionnaire_answers,
  c.completed_at,
  c.completed_at,
  c.completed_at
FROM candidate_runs c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.questionnaire_runs qr
  WHERE qr.user_id = c.user_id
    AND qr.questionnaire_version = c.questionnaire_version
    AND qr.journey_key = c.journey_key
    AND qr.recommended_program = c.recommended_program
    AND qr.completed_at = c.completed_at
);

COMMIT;
