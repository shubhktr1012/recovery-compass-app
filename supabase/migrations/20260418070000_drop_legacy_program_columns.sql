BEGIN;

-- Remove compatibility columns that are no longer used by the live app model.
-- Canonical fields are:
-- - programs.total_days / programs.has_audio
-- - program_days.cards / program_days.estimated_minutes
-- - program_progress.program_id (slug)

ALTER TABLE public.program_progress
  DROP CONSTRAINT IF EXISTS program_progress_program_uuid_fkey;

ALTER TABLE public.program_progress
  DROP COLUMN IF EXISTS program_uuid;

ALTER TABLE public.program_days
  DROP COLUMN IF EXISTS audio_url;

ALTER TABLE public.programs
  DROP COLUMN IF EXISTS duration_days,
  DROP COLUMN IF EXISTS requires_audio;

COMMIT;
