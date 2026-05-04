-- One-off entitlement repair for accounts where RevenueCat purchase events
-- were received before webhook identity resolution was hardened.
--
-- Usage:
-- 1. Replace the user id and VALUES rows with the verified entitlements.
-- 2. Run in the Supabase SQL editor or through a trusted service-role path.
-- 3. Re-run the verification SELECT at the bottom.
--
-- Supabase remains the source of truth for program access. RevenueCat purchases
-- should be copied into program_access; web/manual grants do not need to appear
-- in RevenueCat.

BEGIN;

WITH repair_input(user_id, owned_program, revenuecat_product_id) AS (
  VALUES
    (
      'f48ac99b-70a3-41e1-b45c-b5f72950ba37'::uuid,
      'six_day_reset',
      'six_day_control'
    ),
    (
      'f48ac99b-70a3-41e1-b45c-b5f72950ba37'::uuid,
      'age_reversal',
      'age_reversal'
    ),
    (
      'f48ac99b-70a3-41e1-b45c-b5f72950ba37'::uuid,
      'sleep_disorder_reset',
      'sleep_disorder_reset'
    )
)
INSERT INTO public.program_access (
  user_id,
  owned_program,
  purchase_state,
  completion_state,
  current_day,
  started_at,
  revenuecat_product_id
)
SELECT
  user_id,
  owned_program,
  'owned_active',
  'in_progress',
  1,
  NOW(),
  revenuecat_product_id
FROM repair_input
ON CONFLICT (user_id, owned_program)
DO UPDATE SET
  purchase_state = CASE
    WHEN public.program_access.purchase_state = 'not_owned'
      THEN EXCLUDED.purchase_state
    ELSE public.program_access.purchase_state
  END,
  completion_state = COALESCE(public.program_access.completion_state, EXCLUDED.completion_state),
  current_day = COALESCE(NULLIF(public.program_access.current_day, 0), EXCLUDED.current_day),
  started_at = COALESCE(public.program_access.started_at, EXCLUDED.started_at),
  revenuecat_product_id = COALESCE(
    public.program_access.revenuecat_product_id,
    EXCLUDED.revenuecat_product_id
  ),
  updated_at = NOW();

COMMIT;

SELECT
  owned_program,
  purchase_state,
  completion_state,
  current_day,
  revenuecat_product_id,
  updated_at
FROM public.program_access
WHERE user_id = 'f48ac99b-70a3-41e1-b45c-b5f72950ba37'::uuid
ORDER BY owned_program;
