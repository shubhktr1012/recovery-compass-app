BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Allow public inserts" ON public.waitlist;
CREATE POLICY "Allow public inserts"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (
    length(btrim(first_name)) BETWEEN 1 AND 120
    AND length(btrim(last_name)) BETWEEN 1 AND 120
    AND length(btrim(phone)) BETWEEN 5 AND 32
    AND length(btrim(country_code)) BETWEEN 1 AND 8
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

DROP POLICY IF EXISTS "Allow public enquiry inserts" ON public.enquiries;
CREATE POLICY "Allow public enquiry inserts"
  ON public.enquiries
  FOR INSERT
  TO anon
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 160
    AND length(btrim(phone)) BETWEEN 5 AND 32
    AND length(btrim(message)) BETWEEN 1 AND 5000
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

REVOKE ALL ON FUNCTION public.acknowledge_program_queue_review(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_program_queue_review(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_program_queue_review(text) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_program_lifecycle(text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_program_lifecycle(text, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_program_lifecycle(text, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.configure_program_start(text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.configure_program_start(text, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.configure_program_start(text, date) TO authenticated;

REVOKE ALL ON FUNCTION public.normalize_owned_program_priority_queue(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.normalize_owned_program_priority_queue(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.normalize_owned_program_priority_queue(uuid) FROM authenticated;

REVOKE ALL ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.pause_program_for_absence(text, integer, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_owned_program_purchase(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_owned_program_purchase(text) TO authenticated;

REVOKE ALL ON FUNCTION public.reorder_owned_program_queue(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reorder_owned_program_queue(text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.reorder_owned_program_queue(text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.resume_program_from_pause(text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resume_program_from_pause(text, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.resume_program_from_pause(text, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_program_progress_v2(text, integer, integer[], integer[], timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_program_progress_v2(text, integer, integer[], integer[], timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_program_progress_v2(text, integer, integer[], integer[], timestamptz, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
