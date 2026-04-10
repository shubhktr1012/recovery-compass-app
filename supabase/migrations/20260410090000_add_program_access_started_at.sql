ALTER TABLE public.program_access
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

UPDATE public.program_access
SET started_at = COALESCE(started_at, created_at, NOW())
WHERE started_at IS NULL;

ALTER TABLE public.program_access
  ALTER COLUMN started_at SET DEFAULT NOW();
