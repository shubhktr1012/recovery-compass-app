-- Remove legacy entitlement mirrors from profiles now that program_access is canonical.
-- Keep revenuecat_app_user_id for identity bridging.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS questionnaire_completed,
  DROP COLUMN IF EXISTS active_program,
  DROP COLUMN IF EXISTS subscription_tier,
  DROP COLUMN IF EXISTS subscription_status;
