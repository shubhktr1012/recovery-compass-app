-- Track users who completed onboarding and chose to continue without buying immediately.
-- This lets the app route them to the free dashboard instead of trapping them on paywall.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_tier_activated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.free_tier_activated_at
  IS 'Set when an onboarding-complete user chooses Continue with free access from the paywall.';
