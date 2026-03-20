-- Create smart_notification_queue table
CREATE TABLE public.smart_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- e.g., 'DAY_COMPLETE', 'MISSED_DAY', 'URGE_LOGGED'
  scheduled_for TIMESTAMPTZ NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.smart_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification queue" 
ON public.smart_notification_queue FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their notification queue" 
ON public.smart_notification_queue FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification queue" 
ON public.smart_notification_queue FOR UPDATE 
USING (auth.uid() = user_id);


-- Alter existing notification_logs to link to the queue if needed or add new functionality tracking
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES public.smart_notification_queue(id),
ADD COLUMN IF NOT EXISTS delivery_status TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;
