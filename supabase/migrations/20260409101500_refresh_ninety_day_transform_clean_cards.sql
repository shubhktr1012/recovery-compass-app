-- ninety_day_transform seed (generated from canonical content)
-- Source: documents/Sent By Anjan/program_content/🧭 RECOVERY COMPASS 90-days Program.md
-- Generated at: 2026-04-08T20:16:44.885Z

BEGIN;

DELETE FROM public.program_days
WHERE program_slug = 'ninety_day_transform'
  AND day_number NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90);

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  1,
  'Arriving',
  'Day 1 - Arriving',
  7,
  '[{"type":"intro","dayNumber":1,"dayTitle":"Arriving","goal":"Starting without pressure","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Starting without pressure"],"highlight":"Sit quietly for 1 minute.\nNotice your breath."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-001.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Sit quietly for 1 minute.","Notice your breath."],"whyThisWorks":"Starting without pressure"},{"type":"journal","prompt":"What made me start today?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Showing\nup once is enough.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  2,
  'Noticing Urges',
  'Day 2 - Noticing Urges',
  7,
  '[{"type":"intro","dayNumber":2,"dayTitle":"Noticing Urges","goal":"Urges as signals","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Urges as signals"],"highlight":"When an urge appears, pause for 10\nseconds."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-002.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["When an urge appears, pause for 10","seconds."],"whyThisWorks":"Urges as signals"},{"type":"journal","prompt":"When did urges appear today?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness comes\nbefore change.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  3,
  'Time Patterns',
  'Day 3 - Time Patterns',
  7,
  '[{"type":"intro","dayNumber":3,"dayTitle":"Time Patterns","goal":"Move through Day 3 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 3 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-003.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 3 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 3?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  4,
  'Emotional Triggers',
  'Day 4 - Emotional Triggers',
  7,
  '[{"type":"intro","dayNumber":4,"dayTitle":"Emotional Triggers","goal":"Move through Day 4 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 4 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-004.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 4 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 4?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  5,
  'Body Sensations',
  'Day 5 - Body Sensations',
  7,
  '[{"type":"intro","dayNumber":5,"dayTitle":"Body Sensations","goal":"Move through Day 5 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 5 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-005.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 5 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 5?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  6,
  'Habit Moments',
  'Day 6 - Habit Moments',
  7,
  '[{"type":"intro","dayNumber":6,"dayTitle":"Habit Moments","goal":"Move through Day 6 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 6 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-006.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 6 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 6?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  7,
  'Weekly Reflection',
  'Day 7 - Weekly Reflection',
  7,
  '[{"type":"intro","dayNumber":7,"dayTitle":"Weekly Reflection","goal":"First-week awareness","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["First-week awareness"],"highlight":"Review the week calmly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-007.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Review the week calmly."],"whyThisWorks":"First-week awareness"},{"type":"journal","prompt":"What pattern surprised me?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Noticing is progress.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  8,
  'Stress Signals',
  'Day 8 - Stress Signals',
  7,
  '[{"type":"intro","dayNumber":8,"dayTitle":"Stress Signals","goal":"Move through Day 8 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 8 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-008.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 8 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 8?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  9,
  'Boredom Awareness',
  'Day 9 - Boredom Awareness',
  7,
  '[{"type":"intro","dayNumber":9,"dayTitle":"Boredom Awareness","goal":"Move through Day 9 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 9 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-009.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 9 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 9?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  10,
  'Social Situations',
  'Day 10 - Social Situations',
  7,
  '[{"type":"intro","dayNumber":10,"dayTitle":"Social Situations","goal":"Move through Day 10 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 10 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-010.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 10 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 10?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  11,
  'Energy Levels',
  'Day 11 - Energy Levels',
  7,
  '[{"type":"intro","dayNumber":11,"dayTitle":"Energy Levels","goal":"Move through Day 11 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 11 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-011.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 11 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 11?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  12,
  'Self-Talk',
  'Day 12 - Self-Talk',
  7,
  '[{"type":"intro","dayNumber":12,"dayTitle":"Self-Talk","goal":"Move through Day 12 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 12 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-012.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 12 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 12?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  13,
  'Environment',
  'Day 13 - Environment',
  7,
  '[{"type":"intro","dayNumber":13,"dayTitle":"Environment","goal":"Move through Day 13 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 13 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-013.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 13 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 13?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  14,
  'Weekly Reflection',
  'Day 14 - Weekly Reflection',
  7,
  '[{"type":"intro","dayNumber":14,"dayTitle":"Weekly Reflection","goal":"Move through Day 14 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 14 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-014.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 14 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 14?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  15,
  'Early Urge Signals',
  'Day 15 - Early Urge Signals',
  7,
  '[{"type":"intro","dayNumber":15,"dayTitle":"Early Urge Signals","goal":"Move through Day 15 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 15 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-015.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 15 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 15?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  16,
  'Physical Needs',
  'Day 16 - Physical Needs',
  7,
  '[{"type":"intro","dayNumber":16,"dayTitle":"Physical Needs","goal":"Move through Day 16 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 16 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-016.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 16 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 16?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  17,
  'Mood Shifts',
  'Day 17 - Mood Shifts',
  7,
  '[{"type":"intro","dayNumber":17,"dayTitle":"Mood Shifts","goal":"Move through Day 17 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 17 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-017.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 17 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 17?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  18,
  'Expectation Release',
  'Day 18 - Expectation Release',
  7,
  '[{"type":"intro","dayNumber":18,"dayTitle":"Expectation Release","goal":"Move through Day 18 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 18 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-018.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 18 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 18?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  19,
  'Control vs Compulsion',
  'Day 19 - Control vs Compulsion',
  7,
  '[{"type":"intro","dayNumber":19,"dayTitle":"Control vs Compulsion","goal":"Move through Day 19 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 19 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-019.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 19 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 19?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  20,
  'Readiness',
  'Day 20 - Readiness',
  7,
  '[{"type":"intro","dayNumber":20,"dayTitle":"Readiness","goal":"Move through Day 20 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 20 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-020.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 20 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 20?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  21,
  'Phase Reflection',
  'Day 21 - Phase Reflection',
  7,
  '[{"type":"intro","dayNumber":21,"dayTitle":"Phase Reflection","goal":"Move through Day 21 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 21 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-021.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 21 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 21?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  22,
  'Introducing the Pause',
  'Day 22 - Introducing the Pause',
  7,
  '[{"type":"intro","dayNumber":22,"dayTitle":"Introducing the Pause","goal":"Move through Day 22 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 22 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-022.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 22 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 22?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  23,
  'Staying with Discomfort',
  'Day 23 - Staying with Discomfort',
  7,
  '[{"type":"intro","dayNumber":23,"dayTitle":"Staying with Discomfort","goal":"Move through Day 23 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 23 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-023.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 23 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 23?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  24,
  'Watching the Urge Change',
  'Day 24 - Watching the Urge Change',
  7,
  '[{"type":"intro","dayNumber":24,"dayTitle":"Watching the Urge Change","goal":"Move through Day 24 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 24 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-024.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 24 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 24?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  25,
  'Pausing Without Expectation',
  'Day 25 - Pausing Without Expectation',
  7,
  '[{"type":"intro","dayNumber":25,"dayTitle":"Pausing Without Expectation","goal":"Move through Day 25 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 25 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-025.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 25 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 25?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  26,
  'Pausing Earlier',
  'Day 26 - Pausing Earlier',
  7,
  '[{"type":"intro","dayNumber":26,"dayTitle":"Pausing Earlier","goal":"Move through Day 26 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 26 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-026.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 26 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 26?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  27,
  'Pausing with Kindness',
  'Day 27 - Pausing with Kindness',
  7,
  '[{"type":"intro","dayNumber":27,"dayTitle":"Pausing with Kindness","goal":"Move through Day 27 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 27 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-027.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 27 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 27?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  28,
  'Integrating the Pause',
  'Day 28 - Integrating the Pause',
  7,
  '[{"type":"intro","dayNumber":28,"dayTitle":"Integrating the Pause","goal":"Move through Day 28 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 28 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-028.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 28 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 28?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  29,
  'Identifying a High-risk Moment',
  'Day 29 - Identifying a High-risk Moment',
  7,
  '[{"type":"intro","dayNumber":29,"dayTitle":"Identifying a High-risk Moment","goal":"Move through Day 29 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 29 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-029.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 29 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 29?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  30,
  'Understanding the High-risk Moment',
  'Day 30 - Understanding the High-risk Moment',
  7,
  '[{"type":"intro","dayNumber":30,"dayTitle":"Understanding the High-risk Moment","goal":"Move through Day 30 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 30 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-030.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 30 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 30?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  31,
  'Introducing a Replacement Routine',
  'Day 31 - Introducing a Replacement Routine',
  7,
  '[{"type":"intro","dayNumber":31,"dayTitle":"Introducing a Replacement Routine","goal":"Move through Day 31 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 31 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-031.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 31 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 31?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  32,
  'Trying the Routine Once',
  'Day 32 - Trying the Routine Once',
  7,
  '[{"type":"intro","dayNumber":32,"dayTitle":"Trying the Routine Once","goal":"Move through Day 32 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 32 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-032.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 32 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 32?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  33,
  'Adjusting the Routine',
  'Day 33 - Adjusting the Routine',
  7,
  '[{"type":"intro","dayNumber":33,"dayTitle":"Adjusting the Routine","goal":"Move through Day 33 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 33 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-033.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 33 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 33?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  34,
  'Using the Routine with Less Effort',
  'Day 34 - Using the Routine with Less Effort',
  7,
  '[{"type":"intro","dayNumber":34,"dayTitle":"Using the Routine with Less Effort","goal":"Move through Day 34 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 34 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-034.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 34 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 34?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  35,
  'Noticing What Helps',
  'Day 35 - Noticing What Helps',
  7,
  '[{"type":"intro","dayNumber":35,"dayTitle":"Noticing What Helps","goal":"Move through Day 35 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 35 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-035.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 35 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 35?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  36,
  'Returning Without Resetting',
  'Day 36 - Returning Without Resetting',
  7,
  '[{"type":"intro","dayNumber":36,"dayTitle":"Returning Without Resetting","goal":"Move through Day 36 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 36 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-036.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 36 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 36?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  37,
  'Handling Missed Moments with Calm',
  'Day 37 - Handling Missed Moments with Calm',
  7,
  '[{"type":"intro","dayNumber":37,"dayTitle":"Handling Missed Moments with Calm","goal":"Move through Day 37 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 37 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-037.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 37 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 37?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  38,
  'Reducing All-or-nothing Thinking',
  'Day 38 - Reducing All-or-nothing Thinking',
  7,
  '[{"type":"intro","dayNumber":38,"dayTitle":"Reducing All-or-nothing Thinking","goal":"Move through Day 38 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 38 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-038.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 38 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 38?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  39,
  'Continuing After a Slip',
  'Day 39 - Continuing After a Slip',
  7,
  '[{"type":"intro","dayNumber":39,"dayTitle":"Continuing After a Slip","goal":"Move through Day 39 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 39 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-039.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 39 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 39?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  40,
  'Handling Mixed Days Calmly',
  'Day 40 - Handling Mixed Days Calmly',
  7,
  '[{"type":"intro","dayNumber":40,"dayTitle":"Handling Mixed Days Calmly","goal":"Move through Day 40 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 40 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-040.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 40 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 40?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  41,
  'Trusting Steadiness Over Intensity',
  'Day 41 - Trusting Steadiness Over Intensity',
  7,
  '[{"type":"intro","dayNumber":41,"dayTitle":"Trusting Steadiness Over Intensity","goal":"Move through Day 41 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 41 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-041.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 41 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 41?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  42,
  'Staying Consistent Without Monitoring',
  'Day 42 - Staying Consistent Without Monitoring',
  7,
  '[{"type":"intro","dayNumber":42,"dayTitle":"Staying Consistent Without Monitoring","goal":"Move through Day 42 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 42 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-042.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 42 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 42?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  43,
  'Clear Thinking During Discomfort',
  'Day 43 - Clear Thinking During Discomfort',
  7,
  '[{"type":"intro","dayNumber":43,"dayTitle":"Clear Thinking During Discomfort","goal":"Move through Day 43 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 43 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-043.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 43 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 43?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  44,
  'Confidence Without Urgency',
  'Day 44 - Confidence Without Urgency',
  7,
  '[{"type":"intro","dayNumber":44,"dayTitle":"Confidence Without Urgency","goal":"Move through Day 44 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 44 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-044.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 44 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 44?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  45,
  'Quiet Strength',
  'Day 45 - Quiet Strength',
  7,
  '[{"type":"intro","dayNumber":45,"dayTitle":"Quiet Strength","goal":"Move through Day 45 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 45 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-045.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 45 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 45?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  46,
  'Trusting Yourself Without Tools',
  'Day 46 - Trusting Yourself Without Tools',
  7,
  '[{"type":"intro","dayNumber":46,"dayTitle":"Trusting Yourself Without Tools","goal":"Move through Day 46 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 46 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-046.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 46 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 46?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  47,
  'Letting Habits Fade Naturally',
  'Day 47 - Letting Habits Fade Naturally',
  7,
  '[{"type":"intro","dayNumber":47,"dayTitle":"Letting Habits Fade Naturally","goal":"Move through Day 47 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 47 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-047.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 47 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 47?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  48,
  'Living Without Constant Reference',
  'Day 48 - Living Without Constant Reference',
  7,
  '[{"type":"intro","dayNumber":48,"dayTitle":"Living Without Constant Reference","goal":"Move through Day 48 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 48 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-048.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 48 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 48?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  49,
  'Quiet Confidence',
  'Day 49 - Quiet Confidence',
  7,
  '[{"type":"intro","dayNumber":49,"dayTitle":"Quiet Confidence","goal":"Move through Day 49 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 49 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-049.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 49 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 49?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  50,
  'Living Normally Without Effort',
  'Day 50 - Living Normally Without Effort',
  7,
  '[{"type":"intro","dayNumber":50,"dayTitle":"Living Normally Without Effort","goal":"Move through Day 50 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 50 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-050.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 50 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 50?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  51,
  'Handling Normal Stress Without Old Habits',
  'Day 51 - Handling Normal Stress Without Old Habits',
  7,
  '[{"type":"intro","dayNumber":51,"dayTitle":"Handling Normal Stress Without Old Habits","goal":"Move through Day 51 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 51 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-051.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 51 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 51?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  52,
  'Letting Urges Appear Without Meaning',
  'Day 52 - Letting Urges Appear Without Meaning',
  7,
  '[{"type":"intro","dayNumber":52,"dayTitle":"Letting Urges Appear Without Meaning","goal":"Move through Day 52 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 52 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-052.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 52 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 52?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  53,
  'Letting Thoughts Pass Without Engagement',
  'Day 53 - Letting Thoughts Pass Without Engagement',
  7,
  '[{"type":"intro","dayNumber":53,"dayTitle":"Letting Thoughts Pass Without Engagement","goal":"Move through Day 53 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 53 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-053.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 53 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 53?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  54,
  'Living with Mental Quiet',
  'Day 54 - Living with Mental Quiet',
  7,
  '[{"type":"intro","dayNumber":54,"dayTitle":"Living with Mental Quiet","goal":"Move through Day 54 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 54 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-054.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 54 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 54?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  55,
  'Enjoying Life Without Habit Comparison',
  'Day 55 - Enjoying Life Without Habit Comparison',
  7,
  '[{"type":"intro","dayNumber":55,"dayTitle":"Enjoying Life Without Habit Comparison","goal":"Move through Day 55 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 55 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-055.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 55 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 55?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  56,
  'Letting Motivation Come and Go',
  'Day 56 - Letting Motivation Come and Go',
  7,
  '[{"type":"intro","dayNumber":56,"dayTitle":"Letting Motivation Come and Go","goal":"Move through Day 56 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 56 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-056.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 56 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 56?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  57,
  'Trusting Low-effort Days',
  'Day 57 - Trusting Low-effort Days',
  7,
  '[{"type":"intro","dayNumber":57,"dayTitle":"Trusting Low-effort Days","goal":"Move through Day 57 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 57 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-057.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 57 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 57?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  58,
  'Letting Life Be Uneventful',
  'Day 58 - Letting Life Be Uneventful',
  7,
  '[{"type":"intro","dayNumber":58,"dayTitle":"Letting Life Be Uneventful","goal":"Move through Day 58 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 58 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-058.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 58 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 58?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  59,
  'Long-term Stability',
  'Day 59 - Long-term Stability',
  7,
  '[{"type":"intro","dayNumber":59,"dayTitle":"Long-term Stability","goal":"Move through Day 59 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 59 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-059.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 59 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 59?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  60,
  'Consolidation & Pause',
  'Day 60 - Consolidation & Pause',
  7,
  '[{"type":"intro","dayNumber":60,"dayTitle":"Consolidation & Pause","goal":"Move through Day 60 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 60 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-060.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 60 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 60?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  61,
  'Recognizing Steadiness',
  'Day 61 - Recognizing Steadiness',
  7,
  '[{"type":"intro","dayNumber":61,"dayTitle":"Recognizing Steadiness","goal":"Move through Day 61 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 61 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-061.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 61 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 61?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  62,
  'Remembering Past Wins',
  'Day 62 - Remembering Past Wins',
  7,
  '[{"type":"intro","dayNumber":62,"dayTitle":"Remembering Past Wins","goal":"Move through Day 62 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 62 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-062.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 62 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 62?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  63,
  'Responding Without the App',
  'Day 63 - Responding Without the App',
  7,
  '[{"type":"intro","dayNumber":63,"dayTitle":"Responding Without the App","goal":"Move through Day 63 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 63 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-063.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 63 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 63?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  64,
  'Trusting Yourself in New Situations',
  'Day 64 - Trusting Yourself in New Situations',
  7,
  '[{"type":"intro","dayNumber":64,"dayTitle":"Trusting Yourself in New Situations","goal":"Move through Day 64 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 64 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-064.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 64 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 64?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  65,
  'Staying Steady Without Planning Ahead',
  'Day 65 - Staying Steady Without Planning Ahead',
  7,
  '[{"type":"intro","dayNumber":65,"dayTitle":"Staying Steady Without Planning Ahead","goal":"Move through Day 65 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 65 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-065.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 65 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 65?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  66,
  'Handling Unexpected Challenges Calmly',
  'Day 66 - Handling Unexpected Challenges Calmly',
  7,
  '[{"type":"intro","dayNumber":66,"dayTitle":"Handling Unexpected Challenges Calmly","goal":"Move through Day 66 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 66 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-066.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 66 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 66?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  67,
  'Trusting Yourself After Small Slips',
  'Day 67 - Trusting Yourself After Small Slips',
  7,
  '[{"type":"intro","dayNumber":67,"dayTitle":"Trusting Yourself After Small Slips","goal":"Move through Day 67 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 67 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-067.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 67 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 67?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  68,
  'Living Without Self-checking',
  'Day 68 - Living Without Self-checking',
  7,
  '[{"type":"intro","dayNumber":68,"dayTitle":"Living Without Self-checking","goal":"Move through Day 68 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 68 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-068.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 68 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 68?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  69,
  'Trusting Long Gaps Without Attention',
  'Day 69 - Trusting Long Gaps Without Attention',
  7,
  '[{"type":"intro","dayNumber":69,"dayTitle":"Trusting Long Gaps Without Attention","goal":"Move through Day 69 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 69 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-069.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 69 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 69?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  70,
  'Quiet Confidence',
  'Day 70 - Quiet Confidence',
  7,
  '[{"type":"intro","dayNumber":70,"dayTitle":"Quiet Confidence","goal":"Move through Day 70 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 70 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-070.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 70 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 70?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  71,
  'Living Without a Program',
  'Day 71 - Living Without a Program',
  7,
  '[{"type":"intro","dayNumber":71,"dayTitle":"Living Without a Program","goal":"Move through Day 71 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 71 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-071.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 71 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 71?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  72,
  'Letting Life Lead',
  'Day 72 - Letting Life Lead',
  7,
  '[{"type":"intro","dayNumber":72,"dayTitle":"Letting Life Lead","goal":"Move through Day 72 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 72 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-072.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 72 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 72?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  73,
  'Trusting Ordinary Days',
  'Day 73 - Trusting Ordinary Days',
  7,
  '[{"type":"intro","dayNumber":73,"dayTitle":"Trusting Ordinary Days","goal":"Move through Day 73 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 73 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-073.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 73 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 73?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  74,
  'Letting Motivation Fluctuate',
  'Day 74 - Letting Motivation Fluctuate',
  7,
  '[{"type":"intro","dayNumber":74,"dayTitle":"Letting Motivation Fluctuate","goal":"Move through Day 74 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 74 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-074.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 74 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 74?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  75,
  'Trusting Low-energy Days',
  'Day 75 - Trusting Low-energy Days',
  7,
  '[{"type":"intro","dayNumber":75,"dayTitle":"Trusting Low-energy Days","goal":"Move through Day 75 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 75 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-075.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 75 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 75?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  76,
  'Letting Life Be Uneventful',
  'Day 76 - Letting Life Be Uneventful',
  7,
  '[{"type":"intro","dayNumber":76,"dayTitle":"Letting Life Be Uneventful","goal":"Move through Day 76 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 76 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-076.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 76 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 76?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  77,
  'Trusting Quiet Weeks',
  'Day 77 - Trusting Quiet Weeks',
  7,
  '[{"type":"intro","dayNumber":77,"dayTitle":"Trusting Quiet Weeks","goal":"Move through Day 77 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 77 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-077.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 77 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 77?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  78,
  'Living Without a Narrative',
  'Day 78 - Living Without a Narrative',
  7,
  '[{"type":"intro","dayNumber":78,"dayTitle":"Living Without a Narrative","goal":"Move through Day 78 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 78 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-078.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 78 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 78?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  79,
  'Trusting Identity Without Labels',
  'Day 79 - Trusting Identity Without Labels',
  7,
  '[{"type":"intro","dayNumber":79,"dayTitle":"Trusting Identity Without Labels","goal":"Move through Day 79 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 79 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-079.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 79 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 79?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  80,
  'Living Without Self-definition',
  'Day 80 - Living Without Self-definition',
  7,
  '[{"type":"intro","dayNumber":80,"dayTitle":"Living Without Self-definition","goal":"Move through Day 80 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 80 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-080.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 80 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 80?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  81,
  'Returning Fully to Life',
  'Day 81 - Returning Fully to Life',
  7,
  '[{"type":"intro","dayNumber":81,"dayTitle":"Returning Fully to Life","goal":"Move through Day 81 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 81 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-081.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 81 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 81?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  82,
  'Living Without Reference',
  'Day 82 - Living Without Reference',
  7,
  '[{"type":"intro","dayNumber":82,"dayTitle":"Living Without Reference","goal":"Move through Day 82 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 82 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-082.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 82 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 82?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  83,
  'Letting Time Pass Unnoticed',
  'Day 83 - Letting Time Pass Unnoticed',
  7,
  '[{"type":"intro","dayNumber":83,"dayTitle":"Letting Time Pass Unnoticed","goal":"Move through Day 83 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 83 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-083.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 83 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 83?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  84,
  'Living Without Self-observation',
  'Day 84 - Living Without Self-observation',
  7,
  '[{"type":"intro","dayNumber":84,"dayTitle":"Living Without Self-observation","goal":"Move through Day 84 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 84 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-084.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 84 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 84?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  85,
  'Trusting Life Without Check-ins',
  'Day 85 - Trusting Life Without Check-ins',
  7,
  '[{"type":"intro","dayNumber":85,"dayTitle":"Trusting Life Without Check-ins","goal":"Move through Day 85 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 85 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-085.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 85 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 85?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  86,
  'Letting the App Fade',
  'Day 86 - Letting the App Fade',
  7,
  '[{"type":"intro","dayNumber":86,"dayTitle":"Letting the App Fade","goal":"Move through Day 86 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 86 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-086.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 86 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 86?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  87,
  'Trusting Life Without Support',
  'Day 87 - Trusting Life Without Support',
  7,
  '[{"type":"intro","dayNumber":87,"dayTitle":"Trusting Life Without Support","goal":"Move through Day 87 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 87 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-087.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 87 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 87?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  88,
  'Living Without Return',
  'Day 88 - Living Without Return',
  7,
  '[{"type":"intro","dayNumber":88,"dayTitle":"Living Without Return","goal":"Move through Day 88 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 88 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-088.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 88 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 88?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  89,
  'Letting Life Continue Without Meaning',
  'Day 89 - Letting Life Continue Without Meaning',
  7,
  '[{"type":"intro","dayNumber":89,"dayTitle":"Letting Life Continue Without Meaning","goal":"Move through Day 89 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 89 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-089.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 89 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 89?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  90,
  'Letting Life Be Enough',
  'Day 90 - Letting Life Be Enough',
  7,
  '[{"type":"intro","dayNumber":90,"dayTitle":"Letting Life Be Enough","goal":"Move through Day 90 with calm, steady awareness.","estimatedMinutes":7},{"type":"lesson","title":"Today''s Focus","paragraphs":["Move through Day 90 with calm, steady awareness."],"highlight":"Follow today’s guidance with gentle consistency and no pressure to do it perfectly."},{"type":"audio","title":"Guided Audio","description":"Listen whenever you are ready for today’s guided reflection.","audioStoragePath":"ninety-day/day-090.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Follow today’s guidance with gentle consistency and no pressure to do it perfectly."],"whyThisWorks":"Move through Day 90 with calm, steady awareness."},{"type":"journal","prompt":"What stood out for you on Day 90?","helperText":"A few honest words are enough.","followUpPrompt":"What do you want to remember tomorrow?"},{"type":"close","message":"Awareness grows quietly over time.","secondaryMessage":"Return tomorrow when you feel ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

COMMIT;
