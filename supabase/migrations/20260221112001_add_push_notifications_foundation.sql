-- Add push token to profiles
ALTER TABLE public.profiles
ADD COLUMN expo_push_token TEXT;

-- Create notification tracking table for rate-limiting
CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notification logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own logs (Optional, primarily for backend, but good practice)
CREATE POLICY "Users can insert their own push tokens"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view their own notification logs"
    ON public.notification_logs FOR SELECT
    USING (auth.uid() = user_id);
-- The Edge Function will bypass RLS when inserting logs natively as the service role
;
