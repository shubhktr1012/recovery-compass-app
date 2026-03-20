-- Drop old mock onboarding columns from profiles table
-- We are keeping id, email, onboarding_complete, created_at, updated_at, expo_push_token, push_opt_in

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS quit_date,
  DROP COLUMN IF EXISTS cigarettes_per_day,
  DROP COLUMN IF EXISTS triggers;;
