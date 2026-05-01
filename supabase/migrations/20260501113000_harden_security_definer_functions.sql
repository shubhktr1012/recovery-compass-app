BEGIN;

ALTER FUNCTION public.update_journal_entries_updated_at()
  SET search_path = public;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public;

ALTER FUNCTION public.prevent_profiles_onboarding_regression()
  SET search_path = public;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.select_active_program(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.select_active_program(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.select_active_program(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
REVOKE ALL ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_program_progress(TEXT, INTEGER, INTEGER[], INTEGER[], TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMIT;
