ALTER TABLE public.notification_templates
  DROP CONSTRAINT IF EXISTS notification_templates_type_check;
ALTER TABLE public.notification_templates
  ADD CONSTRAINT notification_templates_type_check CHECK (
    notification_type IN (
      'morning_session_ready',
      'afternoon_check_in',
      'evening_routine',
      'missed_morning_catch_up',
      'day_completed',
      'partial_day',
      'absence_waiting',
      'absence_last_active',
      'paused_reentry',
      'paused_daily_reminder'
    )
  );

ALTER TABLE public.notification_templates
  DROP CONSTRAINT IF EXISTS notification_templates_program_slug_check;
ALTER TABLE public.notification_templates
  ADD CONSTRAINT notification_templates_program_slug_check
  CHECK (
    program_slug = 'global'
    OR program_slug IN (
      'six_day_reset',
      'ninety_day_transform',
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset',
      'free_detox_reset'
    )
  );

ALTER TABLE public.notification_template_variants
  DROP CONSTRAINT IF EXISTS notification_template_variants_type_check;
ALTER TABLE public.notification_template_variants
  ADD CONSTRAINT notification_template_variants_type_check CHECK (
    notification_type IN (
      'morning_session_ready',
      'afternoon_check_in',
      'evening_routine',
      'missed_morning_catch_up',
      'day_completed',
      'partial_day',
      'absence_waiting',
      'absence_last_active',
      'paused_reentry',
      'paused_daily_reminder'
    )
  );

ALTER TABLE public.notification_template_variants
  DROP CONSTRAINT IF EXISTS notification_template_variants_program_slug_check;
ALTER TABLE public.notification_template_variants
  ADD CONSTRAINT notification_template_variants_program_slug_check
  CHECK (
    program_slug = 'global'
    OR program_slug IN (
      'six_day_reset',
      'ninety_day_transform',
      'smoking_alcohol_quit',
      'sleep_disorder_reset',
      'energy_vitality',
      'age_reversal',
      'male_sexual_health',
      'gut_health_reset',
      'free_detox_reset'
    )
  );

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
    'free_detox_reset',
    'Free Detox is ready',
    'Good morning. Day {{dayNumber}} of your Free Detox Program is ready.',
    6,
    30
  ),
  (
    'afternoon_check_in',
    'card_reminder',
    'free_detox_reset',
    'Free Detox check-in',
    'Your short Detox check-in is ready. {{cardTitle}} is waiting.',
    12,
    0
  ),
  (
    'evening_routine',
    'card_reminder',
    'free_detox_reset',
    'Free Detox evening reset',
    'Close the day with your Detox evening step: {{cardTitle}}.',
    19,
    0
  ),
  (
    'missed_morning_catch_up',
    'missed_card_nudge',
    'free_detox_reset',
    'Your Detox day is still open',
    'You missed the morning start. {{catchUpCount}} Detox steps are still available today.',
    14,
    15
  ),
  (
    'day_completed',
    'completion_motivation',
    'free_detox_reset',
    'Detox Day {{dayNumber}} complete',
    '{{completedBody}}',
    NULL,
    NULL
  ),
  (
    'partial_day',
    'completion_motivation',
    'free_detox_reset',
    'Your Detox progress is saved',
    'You completed {{completedCount}} of {{totalCount}} Detox steps today. Return when you can.',
    21,
    0
  ),
  (
    'absence_waiting',
    'absence_reengagement',
    'free_detox_reset',
    'Free Detox is waiting',
    'Your Free Detox Program is still ready. Day {{dayNumber}} is open.',
    6,
    30
  ),
  (
    'absence_last_active',
    'absence_reengagement',
    'free_detox_reset',
    'Your Detox progress is saved',
    'It has been a few days. Your Detox progress is saved whenever you are ready.',
    6,
    30
  ),
  (
    'paused_reentry',
    'absence_reengagement',
    'free_detox_reset',
    'Free Detox is paused',
    'Your Detox reset is paused and saved. Tap when you are ready to continue.',
    6,
    30
  ),
  (
    'paused_daily_reminder',
    'absence_reengagement',
    'free_detox_reset',
    'Free Detox is paused',
    'Your Detox progress is saved. Resume when you are ready.',
    9,
    0
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
