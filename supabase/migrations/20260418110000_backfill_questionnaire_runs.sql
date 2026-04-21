BEGIN;

-- Backfill historical completed questionnaire snapshots into the new append-only
-- questionnaire_runs table.
--
-- Safety rules:
-- - only copy completed questionnaire snapshots from profiles.questionnaire_answers
-- - never copy draft payloads
-- - never create a duplicate history row for the same user/run signature

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
  p.id AS user_id,
  CASE
    WHEN p.questionnaire_answers ->> 'path' = 'guided_recommendation' THEN 'guided_recommendation'
    ELSE 'self_select'
  END AS source,
  p.questionnaire_answers ->> 'version' AS questionnaire_version,
  p.questionnaire_answers ->> 'journey' AS journey_key,
  COALESCE(
    NULLIF(p.recommended_program, ''),
    NULLIF(p.questionnaire_answers ->> 'recommendedProgram', '')
  ) AS recommended_program,
  COALESCE(
    NULLIF(orx.root_cause, ''),
    NULLIF(p.questionnaire_answers ->> 'mainIssue', '')
  ) AS primary_concern_label,
  p.questionnaire_answers,
  COALESCE(p.onboarding_completed_at, p.updated_at, NOW()) AS completed_at,
  COALESCE(p.onboarding_completed_at, p.updated_at, NOW()) AS created_at,
  COALESCE(p.updated_at, p.onboarding_completed_at, NOW()) AS updated_at
FROM public.profiles p
LEFT JOIN public.onboarding_responses orx
  ON orx.user_id = p.id
WHERE p.onboarding_complete IS TRUE
  AND p.questionnaire_answers IS NOT NULL
  AND p.questionnaire_answers ->> 'version' = 'onboarding_redesign_v1'
  AND COALESCE(NULLIF(p.questionnaire_answers ->> 'journey', ''), NULL) IS NOT NULL
  AND COALESCE(
    NULLIF(p.recommended_program, ''),
    NULLIF(p.questionnaire_answers ->> 'recommendedProgram', '')
  ) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.questionnaire_runs qr
    WHERE qr.user_id = p.id
      AND qr.questionnaire_version = p.questionnaire_answers ->> 'version'
      AND qr.journey_key = p.questionnaire_answers ->> 'journey'
      AND qr.recommended_program = COALESCE(
        NULLIF(p.recommended_program, ''),
        NULLIF(p.questionnaire_answers ->> 'recommendedProgram', '')
      )
      AND qr.completed_at = COALESCE(p.onboarding_completed_at, p.updated_at, NOW())
  );

COMMIT;
