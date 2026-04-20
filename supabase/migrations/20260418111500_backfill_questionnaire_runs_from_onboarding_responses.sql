BEGIN;

-- Backfill legacy onboarding summary rows into questionnaire_runs for users whose
-- historical questionnaire data predates the structured
-- profiles.questionnaire_answers snapshot.
--
-- This migration intentionally marks these rows as legacy-derived history rather
-- than pretending they were captured by the modern branch-safe questionnaire
-- model.

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
  'legacy_backfill' AS source,
  'legacy_onboarding_responses_v1' AS questionnaire_version,
  CASE orx.target_selection
    WHEN 'Quit Smoking' THEN 'smoking'
    WHEN '21-Day Deep Sleep Reset' THEN 'sleep_disorder_reset'
    WHEN '14-Day Energy Restore' THEN 'energy_vitality'
    WHEN '90-Day Biohacking Reset' THEN 'age_reversal'
    WHEN '30-Day Men''s Vitality Reset' THEN 'male_sexual_health'
    ELSE NULL
  END AS journey_key,
  CASE orx.target_selection
    WHEN 'Quit Smoking' THEN 'six_day_reset'
    WHEN '21-Day Deep Sleep Reset' THEN 'sleep_disorder_reset'
    WHEN '14-Day Energy Restore' THEN 'energy_vitality'
    WHEN '90-Day Biohacking Reset' THEN 'age_reversal'
    WHEN '30-Day Men''s Vitality Reset' THEN 'male_sexual_health'
    ELSE NULL
  END AS recommended_program,
  NULLIF(orx.root_cause, '') AS primary_concern_label,
  jsonb_build_object(
    'version', 'legacy_onboarding_responses_v1',
    'sourceTable', 'onboarding_responses',
    'fullName', orx.full_name,
    'targetSelection', orx.target_selection,
    'rootCause', orx.root_cause,
    'primaryGoal', orx.primary_goal,
    'pastAttempts', orx.past_attempts,
    'triggers', COALESCE(to_jsonb(orx.triggers), '[]'::jsonb),
    'physicalToll', orx.physical_toll,
    'mentalToll', orx.mental_toll,
    'dailyConsumptionAmount', orx.daily_consumption_amount,
    'dailyConsumptionCost', orx.daily_consumption_cost
  ) AS questionnaire_answers,
  COALESCE(p.onboarding_completed_at, orx.updated_at, p.updated_at, NOW()) AS completed_at,
  COALESCE(orx.updated_at, p.onboarding_completed_at, p.updated_at, NOW()) AS created_at,
  COALESCE(orx.updated_at, p.updated_at, p.onboarding_completed_at, NOW()) AS updated_at
FROM public.onboarding_responses orx
JOIN public.profiles p
  ON p.id = orx.user_id
WHERE p.onboarding_complete IS TRUE
  AND orx.target_selection IN (
    'Quit Smoking',
    '21-Day Deep Sleep Reset',
    '14-Day Energy Restore',
    '90-Day Biohacking Reset',
    '30-Day Men''s Vitality Reset'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.questionnaire_runs qr
    WHERE qr.user_id = p.id
      AND qr.questionnaire_version = 'legacy_onboarding_responses_v1'
      AND qr.source = 'legacy_backfill'
  );

COMMIT;
