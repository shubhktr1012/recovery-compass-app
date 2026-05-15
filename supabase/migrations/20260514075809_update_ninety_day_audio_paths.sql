-- Migration to update ninety_day_transform audio paths from the old
-- padded storage keys (`ninety-day/day-001.mp3`) to the canonical keys
-- (`ninety_day_transform/day-1.mp3`).
--
-- This migration is intentionally compact and idempotent. Earlier versions
-- rewrote full day payloads and filtered `program_id` using a slug string,
-- which breaks local resets once `program_id` is a UUID and `cards` is the
-- active source of truth.

DO $$
DECLARE
  target_program_id uuid;
BEGIN
  SELECT id
  INTO target_program_id
  FROM public.programs
  WHERE slug = 'ninety_day_transform'
  LIMIT 1;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_days'
      AND column_name = 'cards'
  ) THEN
    EXECUTE $cards$
      UPDATE public.program_days
      SET cards = regexp_replace(
        cards::text,
        'ninety-day/day-0*([0-9]+)\.mp3',
        'ninety_day_transform/day-\1.mp3',
        'g'
      )::jsonb
      WHERE (program_slug = 'ninety_day_transform' OR program_id = $1)
        AND cards::text LIKE '%ninety-day/day-%'
    $cards$
    USING target_program_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_days'
      AND column_name = 'content'
  ) THEN
    EXECUTE $content$
      UPDATE public.program_days
      SET content = regexp_replace(
        content::text,
        'ninety-day/day-0*([0-9]+)\.mp3',
        'ninety_day_transform/day-\1.mp3',
        'g'
      )::jsonb
      WHERE (program_slug = 'ninety_day_transform' OR program_id = $1)
        AND content::text LIKE '%ninety-day/day-%'
    $content$
    USING target_program_id;
  END IF;
END
$$;
