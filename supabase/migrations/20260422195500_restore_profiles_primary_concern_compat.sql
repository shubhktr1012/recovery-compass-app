-- Temporary compatibility shim for older onboarding clients that still write
-- `profiles.primary_concern` during completion. The current app no longer
-- depends on this column, but restoring it as nullable prevents runtime save
-- failures without requiring another mobile rebuild.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_concern TEXT;

UPDATE public.profiles AS p
SET primary_concern = source.primary_concern
FROM (
  SELECT
    p2.id,
    COALESCE(
      NULLIF(orx.root_cause, ''),
      NULLIF(p2.questionnaire_answers ->> 'mainIssue', '')
    ) AS primary_concern
  FROM public.profiles AS p2
  LEFT JOIN public.onboarding_responses AS orx
    ON orx.user_id = p2.id
) AS source
WHERE source.id = p.id
  AND p.primary_concern IS NULL
  AND source.primary_concern IS NOT NULL;

NOTIFY pgrst, 'reload schema';
