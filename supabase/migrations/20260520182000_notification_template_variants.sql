-- Phase 5 notification template variants.
-- Variants keep recurring reminders from sounding identical every day while
-- preserving deterministic, DB-editable copy.

CREATE TABLE IF NOT EXISTS public.notification_template_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  tier text NOT NULL,
  program_slug text NOT NULL DEFAULT 'global',
  variant_key text NOT NULL,
  title_template text NOT NULL,
  body_template text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_template_variants_type_check CHECK (
    notification_type IN (
      'morning_session_ready',
      'afternoon_check_in',
      'evening_routine',
      'missed_morning_catch_up',
      'day_completed',
      'partial_day',
      'absence_waiting',
      'absence_last_active',
      'paused_reentry'
    )
  ),
  CONSTRAINT notification_template_variants_tier_check CHECK (
    tier IN (
      'card_reminder',
      'missed_card_nudge',
      'completion_motivation',
      'absence_reengagement'
    )
  ),
  CONSTRAINT notification_template_variants_program_slug_check CHECK (
    program_slug = 'global'
    OR program_slug IN (
      'six_day_reset',
      'ninety_day_transform',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health'
    )
  ),
  CONSTRAINT notification_template_variants_weight_check CHECK (weight > 0),
  CONSTRAINT notification_template_variants_unique_key UNIQUE (
    notification_type,
    program_slug,
    variant_key
  )
);

CREATE INDEX IF NOT EXISTS notification_template_variants_active_lookup_idx
  ON public.notification_template_variants (program_slug, notification_type, variant_key)
  WHERE is_enabled;

DROP TRIGGER IF EXISTS trg_notification_template_variants_updated_at
  ON public.notification_template_variants;
CREATE TRIGGER trg_notification_template_variants_updated_at
  BEFORE UPDATE ON public.notification_template_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.notification_template_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_template_variants_select_active
  ON public.notification_template_variants;
CREATE POLICY notification_template_variants_select_active
  ON public.notification_template_variants
  FOR SELECT
  TO authenticated
  USING (is_enabled);

GRANT SELECT ON public.notification_template_variants TO authenticated;

INSERT INTO public.notification_template_variants (
  notification_type,
  tier,
  program_slug,
  variant_key,
  title_template,
  body_template,
  weight
)
VALUES
  (
    'morning_session_ready',
    'card_reminder',
    'global',
    'morning_01',
    '{{programName}} is ready',
    'Day {{dayNumber}} is ready. Start with the first card when you are ready.',
    1
  ),
  (
    'morning_session_ready',
    'card_reminder',
    'global',
    'morning_02',
    '{{programName}} is ready',
    'Your {{programName}} session is open. Begin with today''s first step.',
    1
  ),
  (
    'morning_session_ready',
    'card_reminder',
    'global',
    'morning_03',
    'Day {{dayNumber}} is ready',
    'A new day is ready in {{programName}}. Start steady.',
    1
  ),
  (
    'morning_session_ready',
    'card_reminder',
    'global',
    'morning_04',
    '{{programName}} is open',
    'Today''s {{programName}} cards are ready. Open Day {{dayNumber}}.',
    1
  ),
  (
    'morning_session_ready',
    'card_reminder',
    'global',
    'morning_05',
    'Day {{dayNumber}} is open',
    '{{totalSteps}} steps are ready for today. Begin calmly.',
    1
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'global',
    'afternoon_01',
    '{{programName}} check-in',
    '{{cardTitle}} is ready when you want a midday reset.',
    1
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'global',
    'afternoon_02',
    'Midday check-in',
    'A short {{programName}} check-in is waiting for Day {{dayNumber}}.',
    1
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'global',
    'afternoon_03',
    '{{programName}} is waiting',
    'Your afternoon card is open: {{cardTitle}}.',
    1
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'global',
    'afternoon_04',
    'Time to check in',
    'Day {{dayNumber}} has a short afternoon step ready.',
    1
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'global',
    'afternoon_05',
    '{{programName}} check-in',
    'Return for a few minutes. {{cardTitle}} is ready.',
    1
  ),
  (
    'evening_routine',
    'card_reminder',
    'global',
    'evening_01',
    '{{programName}} evening routine',
    'Your evening cards are open. Wind down with {{cardTitle}}.',
    1
  ),
  (
    'evening_routine',
    'card_reminder',
    'global',
    'evening_02',
    'Evening cards are ready',
    'Close Day {{dayNumber}} with your {{programName}} evening routine.',
    1
  ),
  (
    'evening_routine',
    'card_reminder',
    'global',
    'evening_03',
    '{{programName}} closeout',
    '{{cardTitle}} is ready when you are done with the day.',
    1
  ),
  (
    'evening_routine',
    'card_reminder',
    'global',
    'evening_04',
    'Evening routine',
    'Your final Day {{dayNumber}} cards are open.',
    1
  ),
  (
    'evening_routine',
    'card_reminder',
    'global',
    'evening_05',
    '{{programName}} is ready',
    'A short evening check-in is waiting: {{cardTitle}}.',
    1
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'global',
    'absence_waiting_01',
    '{{programName}} is waiting',
    'Day {{dayNumber}} is still ready when you are.',
    1
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'global',
    'absence_waiting_02',
    '{{programName}} is open',
    'Your next session is waiting. Pick up with Day {{dayNumber}}.',
    1
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'global',
    'absence_waiting_03',
    'Day {{dayNumber}} is ready',
    'Your {{programName}} progress is saved. Continue when it fits.',
    1
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'global',
    'absence_waiting_04',
    '{{programName}} is waiting',
    'No rush. Day {{dayNumber}} is ready to continue.',
    1
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'global',
    'absence_waiting_05',
    'Your session is ready',
    '{{programName}} is still waiting on Day {{dayNumber}}.',
    1
  )
ON CONFLICT (notification_type, program_slug, variant_key) DO UPDATE
SET
  tier = EXCLUDED.tier,
  title_template = EXCLUDED.title_template,
  body_template = EXCLUDED.body_template,
  weight = EXCLUDED.weight,
  is_enabled = true,
  updated_at = now();
