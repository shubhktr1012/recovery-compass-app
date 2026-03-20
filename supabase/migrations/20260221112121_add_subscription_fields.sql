-- Add subscription related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_tier TEXT DEFAULT 'free',
ADD COLUMN subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN revenuecat_app_user_id TEXT UNIQUE;

-- Create an index on the RevenueCat ID so webhooks can quickly find the right user
CREATE INDEX idx_profiles_revenuecat_id ON public.profiles(revenuecat_app_user_id);
;
