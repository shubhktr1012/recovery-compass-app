-- Paid-program pause reminders use the global template fallback chain.
-- free_detox_reset already has paused_daily_reminder; global was missing it.

INSERT INTO public.notification_templates (
  notification_type,
  tier,
  program_slug,
  title_template,
  body_template,
  trigger_hour,
  trigger_minute
)
VALUES (
  'paused_daily_reminder',
  'absence_reengagement',
  'global',
  '{{programName}} is paused',
  'Your progress is saved. Resume {{programName}} when you are ready.',
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
