-- Create onboarding_responses table
CREATE TABLE public.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_selection TEXT,
  language_selection TEXT,
  full_name TEXT,
  age INTEGER,
  past_attempts TEXT,
  triggers TEXT[],
  root_cause TEXT,
  physical_toll TEXT,
  mental_toll BOOLEAN,
  daily_consumption_amount INTEGER,
  daily_consumption_cost NUMERIC,
  primary_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own onboarding responses"
ON public.onboarding_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding responses"
ON public.onboarding_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding responses"
ON public.onboarding_responses FOR UPDATE
USING (auth.uid() = user_id);
