-- Recovery Compass: Multi-Program Content Schema Upgrade
-- Migration: 20260321_multi_program_content.sql
--
-- This migration upgrades the existing schema for the multi-program pivot.
-- It does NOT drop or destroy existing data.

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. UPGRADE `programs` TABLE
-- ═══════════════════════════════════════════════════
-- Currently only has: id (uuid PK), title (text)
-- Needs: slug, description, total_days, category, has_audio, display_order, is_active

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS total_days INTEGER,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS requires_audio BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Keep legacy and new duration/audio columns aligned during the transition
UPDATE public.programs
SET total_days = duration_days
WHERE total_days IS NULL
  AND duration_days IS NOT NULL;

UPDATE public.programs
SET duration_days = total_days
WHERE duration_days IS NULL
  AND total_days IS NOT NULL;

UPDATE public.programs
SET has_audio = requires_audio
WHERE has_audio IS NULL
  AND requires_audio IS NOT NULL;

UPDATE public.programs
SET requires_audio = has_audio
WHERE requires_audio IS NULL
  AND has_audio IS NOT NULL;

-- Upsert the 6 programs (match on id if rows exist, otherwise insert)
-- First, update any existing rows to have slugs based on their title
UPDATE public.programs SET slug = 'six_day_reset' WHERE title ILIKE '%6%day%' OR title ILIKE '%six%day%';
UPDATE public.programs SET slug = 'ninety_day_transform' WHERE title ILIKE '%90%day%' OR title ILIKE '%ninety%day%';

-- Now insert all 6, skipping any that already have a matching slug
INSERT INTO public.programs (
  slug,
  title,
  description,
  duration_days,
  total_days,
  category,
  requires_audio,
  has_audio,
  display_order
)
VALUES
  ('six_day_reset', '6-Day Control', 'Break the autopilot. Build the foundation for lasting change in just 6 days.', 6, 6, 'smoking', false, false, 1),
  ('ninety_day_transform', '90-Day Quit', 'A complete guided journey from awareness to freedom. Daily meditations, reflections, and gentle progress.', 90, 90, 'smoking', true, true, 2),
  ('sleep_disorder_reset', '21-Day Sleep Reset', 'Reset your body clock and nervous system for deep, restorative sleep.', 21, 21, 'sleep', true, true, 3),
  ('male_sexual_health', '45-Day Vitality', 'Strengthen control, restore confidence, and rebuild your natural vitality.', 45, 45, 'sexual_health', false, false, 4),
  ('energy_vitality', '42-Day Energy Reset', 'Restore your body''s natural energy production through the right daily rhythm.', 42, 42, 'energy', false, false, 5),
  ('age_reversal', '90-Day Biohacking Reset', 'Activate your body''s natural rejuvenation. Ancient protocols backed by modern science.', 90, 90, 'aging', false, false, 6)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_days = EXCLUDED.duration_days,
  total_days = EXCLUDED.total_days,
  category = EXCLUDED.category,
  requires_audio = EXCLUDED.requires_audio,
  has_audio = EXCLUDED.has_audio,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();


-- ═══════════════════════════════════════════════════
-- 2. UPGRADE `program_days` TABLE
-- ═══════════════════════════════════════════════════
-- Currently has: id, program_id (uuid FK), day_number, title, content_text, audio_url, duration_minutes
-- Needs: program_slug (text), cards (JSONB), estimated_minutes
-- Keep existing columns — don't drop content_text or audio_url

ALTER TABLE public.program_days
  ADD COLUMN IF NOT EXISTS program_slug TEXT,
  ADD COLUMN IF NOT EXISTS cards JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS day_title TEXT;

-- Copy the existing title column to day_title if day_title is empty
UPDATE public.program_days SET day_title = title WHERE day_title IS NULL;

-- Backfill program_slug from the programs table for existing rows
UPDATE public.program_days pd
SET program_slug = p.slug
FROM public.programs p
WHERE pd.program_id = p.id
  AND pd.program_slug IS NULL;

-- Add a unique constraint on (program_slug, day_number) for new content
-- Only if there are no conflicts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'program_days_slug_day_unique' AND conrelid = 'public.program_days'::regclass
  ) THEN
    -- First check for duplicate (program_slug, day_number) pairs
    IF NOT EXISTS (
      SELECT program_slug, day_number, COUNT(*)
      FROM public.program_days
      WHERE program_slug IS NOT NULL
      GROUP BY program_slug, day_number
      HAVING COUNT(*) > 1
    ) THEN
      ALTER TABLE public.program_days
        ADD CONSTRAINT program_days_slug_day_unique UNIQUE (program_slug, day_number);
    END IF;
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_program_days_slug_day
  ON public.program_days(program_slug, day_number);


-- ═══════════════════════════════════════════════════
-- 3. UPGRADE `program_access` FOR MULTI-PROGRAM
-- ═══════════════════════════════════════════════════
-- Currently: user_id is PRIMARY KEY (one program per user)
-- Needs: support multiple programs per user

-- Add an id column if it doesn't exist
ALTER TABLE public.program_access
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Fill any NULL ids
UPDATE public.program_access SET id = gen_random_uuid() WHERE id IS NULL;

-- Drop the old primary key (user_id)
-- This is wrapped in a DO block because the constraint name might vary
DO $$
DECLARE
  pk_name TEXT;
BEGIN
  SELECT conname INTO pk_name
  FROM pg_constraint
  WHERE conrelid = 'public.program_access'::regclass
    AND contype = 'p';

  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.program_access DROP CONSTRAINT %I', pk_name);
  END IF;
END $$;

-- Set id as the new primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.program_access'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.program_access ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Add unique constraint on (user_id, owned_program)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'program_access_user_program_unique' AND conrelid = 'public.program_access'::regclass
  ) THEN
    ALTER TABLE public.program_access
      ADD CONSTRAINT program_access_user_program_unique UNIQUE (user_id, owned_program);
  END IF;
END $$;

-- Update CHECK constraint to allow all 6 slugs
ALTER TABLE public.program_access DROP CONSTRAINT IF EXISTS program_access_owned_program_check;
ALTER TABLE public.program_access
  ADD CONSTRAINT program_access_owned_program_check
  CHECK (owned_program IS NULL OR owned_program IN (
    'six_day_reset',
    'ninety_day_transform',
    'sleep_disorder_reset',
    'energy_vitality',
    'age_reversal',
    'male_sexual_health'
  ));


-- ═══════════════════════════════════════════════════
-- 4. UPGRADE `profiles` TABLE
-- ═══════════════════════════════════════════════════

-- Add questionnaire columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS questionnaire_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_concern TEXT,
  ADD COLUMN IF NOT EXISTS recommended_program TEXT,
  ADD COLUMN IF NOT EXISTS questionnaire_answers JSONB,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Update active_program constraint to allow all 6 slugs
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_program_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_program_check
  CHECK (
    active_program IS NULL
    OR active_program IN (
      'six_day_reset',
      'ninety_day_transform',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      '6-DAY'  -- Keep old value valid so existing rows don't break
    )
  );

-- Update subscription_tier constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (
    subscription_tier IS NULL
    OR subscription_tier IN ('free', '6-day', '90-day', 'sleep', 'energy', 'aging', 'sexual_health')
  );


-- ═══════════════════════════════════════════════════
-- 5. RLS POLICIES FOR CONTENT TABLES
-- ═══════════════════════════════════════════════════

-- Programs: anyone authenticated can read
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read programs" ON public.programs;
CREATE POLICY "Anyone can read programs"
  ON public.programs FOR SELECT TO authenticated USING (true);

-- Program days: anyone authenticated can read
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read program days" ON public.program_days;
CREATE POLICY "Anyone can read program days"
  ON public.program_days FOR SELECT TO authenticated USING (true);


-- ═══════════════════════════════════════════════════
-- 6. UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_programs_updated_at ON public.programs;
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_program_days_updated_at ON public.program_days;
CREATE TRIGGER update_program_days_updated_at
  BEFORE UPDATE ON public.program_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
