BEGIN;

ALTER TABLE public.program_days
  DROP COLUMN IF EXISTS content_text;

COMMIT;
