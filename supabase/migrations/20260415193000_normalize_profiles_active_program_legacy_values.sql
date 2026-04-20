BEGIN;

-- Production-safe normalization pass:
-- convert remaining legacy profile active_program aliases to modern slugs
-- without dropping columns or tightening constraints yet.
UPDATE public.profiles
SET
  active_program = CASE
    WHEN active_program IN ('6-DAY', 'six_day_control') THEN 'six_day_reset'
    WHEN active_program IN ('90-DAY', 'ninety_day_quit') THEN 'ninety_day_transform'
    ELSE active_program
  END,
  updated_at = NOW()
WHERE active_program IN ('6-DAY', '90-DAY', 'six_day_control', 'ninety_day_quit');

COMMIT;
