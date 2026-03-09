-- Create media_assets table for CMS referencing
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('AUDIO', 'VIDEO', 'IMAGE', 'DOCUMENT')),
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL, -- Path within Supabase Storage bucket
  public_url TEXT,
  duration_seconds INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)

-- Media assets should be viewable by everyone
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media assets are viewable by everyone" ON public.media_assets FOR SELECT USING (true);
