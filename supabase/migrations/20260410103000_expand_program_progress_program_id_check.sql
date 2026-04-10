ALTER TABLE public.program_progress
  DROP CONSTRAINT IF EXISTS program_progress_program_id_check;

ALTER TABLE public.program_progress
  ADD CONSTRAINT program_progress_program_id_check
  CHECK (
    program_id IN (
      'six_day_reset',
      'ninety_day_transform',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health'
    )
  );
