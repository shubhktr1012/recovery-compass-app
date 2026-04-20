BEGIN;

-- Prepare program_reflections for archive browsing and use the shared generic
-- updated_at trigger function instead of the older journal-specific one.

CREATE INDEX IF NOT EXISTS program_reflections_user_updated_at_idx
  ON public.program_reflections (user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_program_reflections_updated_at ON public.program_reflections;

CREATE TRIGGER trg_program_reflections_updated_at
  BEFORE UPDATE ON public.program_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
