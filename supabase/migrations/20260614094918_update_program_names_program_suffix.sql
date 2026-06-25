-- Recovery Compass: final public-facing program display names.
-- Technical identifiers stay unchanged: slugs, RevenueCat IDs, product IDs, and access logic.

BEGIN;

UPDATE public.programs
SET
  title = CASE slug
    WHEN 'smoking_alcohol_quit' THEN 'Smoking & Alcohol Quit Program'
    WHEN 'gut_health_reset' THEN 'Gut Reset Program'
    WHEN 'sleep_disorder_reset' THEN 'Deep Sleep Reset Program'
    WHEN 'energy_vitality' THEN 'Energy Restore Program'
    WHEN 'male_sexual_health' THEN 'Men’s Vitality Reset Program'
    WHEN 'age_reversal' THEN 'Age Reversal Program'
    WHEN 'free_detox_reset' THEN 'Free Detox Program'
    ELSE title
  END,
  updated_at = NOW()
WHERE slug IN (
  'smoking_alcohol_quit',
  'gut_health_reset',
  'sleep_disorder_reset',
  'energy_vitality',
  'male_sexual_health',
  'age_reversal',
  'free_detox_reset'
);

UPDATE public.program_days
SET
  cards = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    cards::text,
                    'Better Sleep: continue with the 21-Day Deep Sleep Reset.',
                    'Better Sleep: continue with the Deep Sleep Reset Program.'
                  ),
                  'Better Sleep: continue with Deep Sleep Reset.',
                  'Better Sleep: continue with the Deep Sleep Reset Program.'
                ),
                'More Energy: continue with the 14-Day Energy Restore.',
                'More Energy: continue with the Energy Restore Program.'
              ),
              'More Energy: continue with Energy Restore.',
              'More Energy: continue with the Energy Restore Program.'
            ),
            'Gut Health: continue with the 21-Day Gut Reset.',
            'Gut Health: continue with the Gut Reset Program.'
          ),
          'Gut Health: continue with Gut Reset.',
          'Gut Health: continue with the Gut Reset Program.'
        ),
        'Quit Smoking or Alcohol: continue with the 21-Day Smoking and Alcohol Quit program.',
        'Quit Smoking or Alcohol: continue with the Smoking & Alcohol Quit Program.'
      ),
      'Quit Smoking or Alcohol: continue with Smoking & Alcohol Quit.',
      'Quit Smoking or Alcohol: continue with the Smoking & Alcohol Quit Program.'
    ),
    'Your 6-Day Free Detox Program is complete.',
    'Your Free Detox Program is complete.'
  )::jsonb,
  updated_at = NOW()
WHERE program_slug = 'free_detox_reset'
  AND day_number = 6;

COMMIT;
