-- Add fields for Push Notifications to the profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS quiet_hours_start SMALLINT NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS quiet_hours_end SMALLINT NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS preferred_push_hour SMALLINT NOT NULL DEFAULT 9;

-- Add comment
COMMENT ON COLUMN public.profiles.expo_push_token IS 'The Expo Push Token for this device to send notifications to.';
