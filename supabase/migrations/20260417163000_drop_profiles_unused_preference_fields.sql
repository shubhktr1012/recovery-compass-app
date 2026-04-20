-- Remove unused and redundant profile preference fields.
-- Keep expo_push_token, push_opt_in, onboarding_complete, onboarding_completed_at, and recommended_program.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS primary_concern,
  DROP COLUMN IF EXISTS quiet_hours_start,
  DROP COLUMN IF EXISTS quiet_hours_end,
  DROP COLUMN IF EXISTS preferred_push_hour;
