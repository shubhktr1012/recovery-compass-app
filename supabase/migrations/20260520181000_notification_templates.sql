-- Phase 5 notification templates.
-- The app keeps safe built-in fallbacks, but this table lets copy and trigger
-- times be adjusted without shipping a new app binary.

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  tier text NOT NULL,
  program_slug text NOT NULL DEFAULT 'global',
  title_template text NOT NULL,
  body_template text NOT NULL,
  trigger_hour integer,
  trigger_minute integer,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_templates_type_check CHECK (
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
  CONSTRAINT notification_templates_tier_check CHECK (
    tier IN (
      'card_reminder',
      'missed_card_nudge',
      'completion_motivation',
      'absence_reengagement'
    )
  ),
  CONSTRAINT notification_templates_program_slug_check CHECK (
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
  CONSTRAINT notification_templates_trigger_hour_check CHECK (
    trigger_hour IS NULL OR trigger_hour BETWEEN 0 AND 23
  ),
  CONSTRAINT notification_templates_trigger_minute_check CHECK (
    trigger_minute IS NULL OR trigger_minute BETWEEN 0 AND 59
  ),
  CONSTRAINT notification_templates_trigger_pair_check CHECK (
    (trigger_hour IS NULL AND trigger_minute IS NULL)
    OR (trigger_hour IS NOT NULL AND trigger_minute IS NOT NULL)
  ),
  CONSTRAINT notification_templates_unique_type_program UNIQUE (notification_type, program_slug)
);

CREATE INDEX IF NOT EXISTS notification_templates_active_lookup_idx
  ON public.notification_templates (program_slug, notification_type)
  WHERE is_enabled;

DROP TRIGGER IF EXISTS trg_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read active notification templates"
  ON public.notification_templates;
CREATE POLICY "Authenticated users can read active notification templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (is_enabled);

GRANT SELECT ON public.notification_templates TO authenticated;

INSERT INTO public.notification_templates (
  notification_type,
  tier,
  program_slug,
  title_template,
  body_template,
  trigger_hour,
  trigger_minute
)
VALUES
  (
    'morning_session_ready',
    'card_reminder',
    'global',
    '{{programName}} is ready',
    'Good morning. Your {{programName}} session is ready. {{totalSteps}} steps today.',
    6,
    30
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'global',
    '{{programName}} check-in',
    'Your {{programName}} afternoon check-in is ready. {{cardTitle}} is waiting.',
    12,
    0
  ),
  (
    'evening_routine',
    'card_reminder',
    'global',
    '{{programName}} evening routine',
    'Your {{programName}} evening routine is ready. Wind down with {{cardTitle}}.',
    19,
    0
  ),
  (
    'missed_morning_catch_up',
    'missed_card_nudge',
    'global',
    '{{programName}} catch-up available',
    'You missed your {{programName}} morning session. {{catchUpCount}} cards are still available to catch up on.',
    14,
    15
  ),
  (
    'day_completed',
    'completion_motivation',
    'global',
    'Day {{dayNumber}} complete',
    '{{completedBody}}',
    NULL,
    NULL
  ),
  (
    'partial_day',
    'completion_motivation',
    'global',
    '{{programName}} progress saved',
    'You got through {{completedCount}} of {{totalCount}} cards today. Every step counts.',
    21,
    0
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'global',
    '{{programName}} is waiting',
    'Your {{programName}} session is waiting. Day {{dayNumber}} is ready.',
    6,
    30
  ),
  (
    'absence_last_active',
    'absence_reengagement',
    'global',
    '{{programName}} is saved',
    'It has been a few days. Your progress is saved. Pick up whenever you are ready.',
    6,
    30
  ),
  (
    'paused_reentry',
    'absence_reengagement',
    'global',
    '{{programName}} is paused',
    'Your program is paused and waiting. No pressure. Tap to pick up where you left off.',
    6,
    30
  )
ON CONFLICT (notification_type, program_slug) DO UPDATE
SET
  tier = EXCLUDED.tier,
  title_template = EXCLUDED.title_template,
  body_template = EXCLUDED.body_template,
  trigger_hour = EXCLUDED.trigger_hour,
  trigger_minute = EXCLUDED.trigger_minute,
  is_enabled = true,
  updated_at = now();
