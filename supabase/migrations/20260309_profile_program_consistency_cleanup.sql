BEGIN;

-- Ensure every auth user has a profile row before we reconcile program state.
INSERT INTO public.profiles (
  id,
  email,
  onboarding_complete,
  push_opt_in,
  timezone,
  quiet_hours_start,
  quiet_hours_end,
  preferred_push_hour,
  subscription_tier,
  subscription_status,
  revenuecat_app_user_id
)
SELECT
  users.id,
  users.email,
  FALSE,
  FALSE,
  'Asia/Kolkata',
  22,
  6,
  9,
  'free',
  'inactive',
  users.id::text
FROM auth.users AS users
LEFT JOIN public.profiles AS profiles
  ON profiles.id = users.id
WHERE profiles.id IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_program_check;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

-- Normalize legacy aliases on profiles before syncing from program_access.
UPDATE public.profiles
SET
  active_program = CASE
    WHEN active_program IN ('6-DAY', 'six_day_control') THEN 'six_day_reset'
    WHEN active_program IN ('90-DAY', 'ninety_day_quit') THEN 'ninety_day_transform'
    WHEN active_program IN ('six_day_reset', 'ninety_day_transform') THEN active_program
    ELSE NULL
  END,
  subscription_tier = CASE
    WHEN subscription_tier IN ('6-day', '90-day', 'free') THEN subscription_tier
    ELSE 'free'
  END,
  subscription_status = CASE
    WHEN subscription_status IN ('active', 'inactive', 'expired') THEN subscription_status
    ELSE 'inactive'
  END,
  revenuecat_app_user_id = COALESCE(revenuecat_app_user_id, id::text),
  updated_at = NOW();

-- Normalize program_access to the app's internal slugs and consistent state shape.
UPDATE public.program_access
SET owned_program = CASE
  WHEN owned_program IN ('6-DAY', 'six_day_control') THEN 'six_day_reset'
  WHEN owned_program IN ('90-DAY', 'ninety_day_quit') THEN 'ninety_day_transform'
  WHEN owned_program IN ('six_day_reset', 'ninety_day_transform') THEN owned_program
  ELSE NULL
END;

UPDATE public.program_access
SET
  current_day = CASE
    WHEN owned_program IS NULL THEN NULL
    WHEN owned_program = 'six_day_reset' THEN LEAST(GREATEST(COALESCE(current_day, 1), 1), 6)
    WHEN owned_program = 'ninety_day_transform' THEN LEAST(GREATEST(COALESCE(current_day, 1), 1), 90)
    ELSE NULL
  END,
  purchase_state = CASE
    WHEN owned_program IS NULL THEN 'not_owned'
    WHEN archived_at IS NOT NULL THEN 'owned_archived'
    WHEN completed_at IS NOT NULL THEN 'owned_completed'
    ELSE 'owned_active'
  END,
  completion_state = CASE
    WHEN owned_program IS NULL THEN 'not_started'
    WHEN archived_at IS NOT NULL THEN 'archived'
    WHEN completed_at IS NOT NULL THEN 'completed'
    ELSE 'in_progress'
  END,
  revenuecat_product_id = CASE
    WHEN owned_program IS NULL THEN NULL
    WHEN owned_program = 'six_day_reset' AND COALESCE(NULLIF(TRIM(revenuecat_product_id), ''), '') = '' THEN 'six_day_control'
    WHEN owned_program = 'ninety_day_transform' AND COALESCE(NULLIF(TRIM(revenuecat_product_id), ''), '') = '' THEN 'ninety_day_quit'
    ELSE revenuecat_product_id
  END,
  completed_at = CASE
    WHEN owned_program IS NULL THEN NULL
    ELSE completed_at
  END,
  archived_at = CASE
    WHEN owned_program IS NULL THEN NULL
    ELSE archived_at
  END,
  updated_at = NOW();

-- Normalize and prune progress so it cannot contradict owned access.
UPDATE public.program_progress
SET program_id = CASE
  WHEN program_id IN ('6-DAY', 'six_day_control') THEN 'six_day_reset'
  WHEN program_id IN ('90-DAY', 'ninety_day_quit') THEN 'ninety_day_transform'
  ELSE program_id
END
WHERE program_id IN ('6-DAY', '90-DAY', 'six_day_control', 'ninety_day_quit');

DELETE FROM public.program_progress
WHERE program_id NOT IN ('six_day_reset', 'ninety_day_transform')
   OR (program_id = 'six_day_reset' AND (day_id < 1 OR day_id > 6))
   OR (program_id = 'ninety_day_transform' AND (day_id < 1 OR day_id > 90));

DELETE FROM public.program_progress AS progress
WHERE NOT EXISTS (
  SELECT 1
  FROM public.program_access AS access
  WHERE access.user_id = progress.user_id
    AND access.owned_program IS NOT NULL
    AND access.owned_program = progress.program_id
);

-- Sync profile program and legacy subscription fields from authoritative program_access rows.
UPDATE public.profiles AS profiles
SET
  active_program = access.owned_program,
  subscription_tier = CASE
    WHEN access.owned_program = 'six_day_reset' THEN '6-day'
    WHEN access.owned_program = 'ninety_day_transform' THEN '90-day'
    ELSE 'free'
  END,
  subscription_status = CASE
    WHEN access.owned_program IS NULL THEN 'inactive'
    ELSE 'active'
  END,
  updated_at = NOW()
FROM public.program_access AS access
WHERE access.user_id = profiles.id;

-- Any profile without owned access should read as free/inactive with no active program.
UPDATE public.profiles AS profiles
SET
  active_program = NULL,
  subscription_tier = 'free',
  subscription_status = 'inactive',
  updated_at = NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.program_access AS access
  WHERE access.user_id = profiles.id
    AND access.owned_program IS NOT NULL
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_program_check
  CHECK (
    active_program IS NULL
    OR active_program IN ('six_day_reset', 'ninety_day_transform')
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (
    subscription_tier IS NULL
    OR subscription_tier IN ('free', '6-day', '90-day')
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_status_check
  CHECK (
    subscription_status IS NULL
    OR subscription_status IN ('inactive', 'active', 'expired')
  );

COMMIT;
