-- Apply ninety_day_transform canonical seed (90 days)
-- Generated on 2026-04-03T14:14:42Z

DELETE FROM public.program_days
WHERE program_slug = 'ninety_day_transform'
  AND day_number NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90);

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  1,
  'Arriving',
  'Day 1 - Arriving',
  '',
  12,
  '[{"type":"intro","dayNumber":1,"dayTitle":"Arriving","goal":"Psychological safety + low resistance SCREEN 1: DAY INTRO (TEXT) Screen title: Day 1 · Arriving Main copy (exact):","estimatedMinutes":12},{"type":"lesson","title":"Today''s Focus","paragraphs":["Psychological safety + low resistance SCREEN 1: DAY INTRO (TEXT) Screen title: Day 1 · Arriving Main copy (exact):"],"highlight":"Psychological safety + low resistance SCREEN 1: DAY INTRO (TEXT) Screen title: Day 1 · Arriving Main copy (exact):"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Starting without pressure Exercise: Sit quietly for 1 minute.","Notice your breath. Journal: “What made me start today?” Close: “Showing","up once is enough.”","DAY 1 – ARRIVING","(Audio + Text + Journal Screens)","Total time: 4 – 6 minutes Tone: Calm, permission-based, non-medical"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 1?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 1 is complete.","secondaryMessage":"Psychological safety + low resistance SCREEN 1: DAY INTRO (TEXT) Screen title: Day 1 · Arriving Main copy (exact):"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  2,
  'Noticing Urges',
  'Day 2 - Noticing Urges',
  '',
  12,
  '[{"type":"intro","dayNumber":2,"dayTitle":"Noticing Urges","goal":"Complete Day 2 with steady, consistent action.","estimatedMinutes":12},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 2 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Urges as signals Exercise: When an urge appears, pause for 10","seconds. Journal: “When did urges appear today?” Close: “Awareness comes","before change.”","DAY 2 – NOTICING URGES","(Audio + Text + Reflection Screens)","Total time: 5 – 7 minutes Tone: Curious, calm, non-judgmental Goal:"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 2?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 2 is complete.","secondaryMessage":"You reinforced noticing urges today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  3,
  'Time Patterns',
  'Day 3 - Time Patterns',
  '',
  13,
  '[{"type":"intro","dayNumber":3,"dayTitle":"Time Patterns","goal":"Help users notice _when_ urges appear — not to control them yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 3 · Time Patterns Main copy (exact):","estimatedMinutes":13},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users notice _when_ urges appear — not to control them yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 3 · Time Patterns Main copy (exact):"],"highlight":"Help users notice _when_ urges appear — not to control them yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 3 · Time Patterns Main copy (exact):"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: When urges show up Exercise: Mentally note the time of each urge.","Journal: “Which time of day feels hardest?” Close: “Patterns are","information.”","DAY 3 – TIME PATTERNS","(Text + Guided Awareness + Reflection)","Total time: 5 – 7 minutes Tone: Curious, practical, non-judgmental"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 3?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 3 is complete.","secondaryMessage":"Help users notice _when_ urges appear — not to control them yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 3 · Time Patterns Main copy (exact):"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  4,
  'Emotional Triggers',
  'Day 4 - Emotional Triggers',
  '',
  13,
  '[{"type":"intro","dayNumber":4,"dayTitle":"Emotional Triggers","goal":"Complete Day 4 with steady, consistent action.","estimatedMinutes":13},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 4 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Emotions before urges Exercise: Name one emotion you felt today.","Journal: “What emotion appeared before the urge?” Close: “Feelings don’t","need fixing.”","DAY 4 – EMOTIONAL TRIGGERS","(Text + Guided Awareness + Reflection)","Total time: 6 – 8 minutes Tone: Gentle, curious, validating Goal:"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 4?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 4 is complete.","secondaryMessage":"You reinforced emotional triggers today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  5,
  'Body Sensations',
  'Day 5 - Body Sensations',
  '',
  14,
  '[{"type":"intro","dayNumber":5,"dayTitle":"Body Sensations","goal":"Complete Day 5 with steady, consistent action.","estimatedMinutes":14},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 5 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Where urges live in the body Exercise: Body scan for 1 minute.","Journal: “Where did I feel tension today?” Close: “The body speaks","quietly.”","DAY 5 – BODY SENSATIONS","(Text + Guided Awareness + Reflection)","Total time: 6 – 8 minutes Tone: Grounded, neutral, reassuring Goal:"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 5?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 5 is complete.","secondaryMessage":"You reinforced body sensations today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  6,
  'Habit Moments',
  'Day 6 - Habit Moments',
  '',
  14,
  '[{"type":"intro","dayNumber":6,"dayTitle":"Habit Moments","goal":"Help users recognize _automatic habit moments_ without shame or pressure to change yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 6 · Habit Moments","estimatedMinutes":14},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users recognize _automatic habit moments_ without shame or pressure to change yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 6 · Habit Moments"],"highlight":"Help users recognize _automatic habit moments_ without shame or pressure to change yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 6 · Habit Moments"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Routine-based urges Exercise: Notice one repeated habit moment.","Journal: “Which moments feel automatic?” Close: “Habits form quietly.”","DAY 6 – HABIT MOMENTS","(Text + Guided Awareness + Reflection)","Total time: 6 – 8 minutes Tone: Practical, reassuring, non-judgmental","Goal: Help users recognize _automatic habit moments_ without shame or"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 6?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 6 is complete.","secondaryMessage":"Help users recognize _automatic habit moments_ without shame or pressure to change yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 6 · Habit Moments"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  7,
  'Weekly Reflection',
  'Day 7 - Weekly Reflection',
  '',
  15,
  '[{"type":"intro","dayNumber":7,"dayTitle":"Weekly Reflection","goal":"Complete Day 7 with steady, consistent action.","estimatedMinutes":15},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 7 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: First-week awareness Exercise: Review the week calmly.","Journal: “What pattern surprised me?” Close: “Noticing is progress.”","This day is extremely important. It determines whether users feel","discouraged or grounded going into the next week.","Everything here is:","non-medical"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 7?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 7 is complete.","secondaryMessage":"You reinforced weekly reflection today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  8,
  'Stress Signals',
  'Day 8 - Stress Signals',
  '',
  15,
  '[{"type":"intro","dayNumber":8,"dayTitle":"Stress Signals","goal":"Help users recognize stress as a _signal_ , not a problem — and reduce automatic urge responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 8 · Stress Signals","estimatedMinutes":15},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users recognize stress as a _signal_ , not a problem — and reduce automatic urge responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 8 · Stress Signals"],"highlight":"Help users recognize stress as a _signal_ , not a problem — and reduce automatic urge responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 8 · Stress Signals"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Stress and urges Exercise: Rate stress once today","(low/medium/high). Journal: “How does stress affect me?” Close: “Stress","asks for care.”","DAY 8 – STRESS SIGNALS","(Audio + Text + Reflection Screens)","Total time: 6 – 8 minutes Tone: Reassuring, grounded, non-alarming"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 8?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 8 is complete.","secondaryMessage":"Help users recognize stress as a _signal_ , not a problem — and reduce automatic urge responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 8 · Stress Signals"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  9,
  'Boredom Awareness',
  'Day 9 - Boredom Awareness',
  '',
  16,
  '[{"type":"intro","dayNumber":9,"dayTitle":"Boredom Awareness","goal":"Help users distinguish boredom from desire and reduce automatic habit responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 9 · Boredom Awareness","estimatedMinutes":16},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users distinguish boredom from desire and reduce automatic habit responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 9 · Boredom Awareness"],"highlight":"Help users distinguish boredom from desire and reduce automatic habit responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 9 · Boredom Awareness"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Boredom vs desire Exercise: Sit with boredom for 30 seconds.","Journal: “What do I usually do when bored?” Close: “Boredom passes.”","DAY 9 – BOREDOM AWARENESS","(Audio + Text + Reflection Screens)","Total time: 6 – 8 minutes Tone: Neutral, steady, lightly curious","Goal: Help users distinguish boredom from desire and reduce automatic"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 9?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 9 is complete.","secondaryMessage":"Help users distinguish boredom from desire and reduce automatic habit responses SCREEN 1: DAY INTRO (TEXT) Screen title: Day 9 · Boredom Awareness"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  10,
  'Social Situations',
  'Day 10 - Social Situations',
  '',
  16,
  '[{"type":"intro","dayNumber":10,"dayTitle":"Social Situations","goal":"Help users recognize social pressure as a trigger , without forcing avoidance or confrontation SCREEN 1: DAY INTRO (TEXT) Screen title: Day 10 · Social Situations","estimatedMinutes":16},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users recognize social pressure as a trigger , without forcing avoidance or confrontation SCREEN 1: DAY INTRO (TEXT) Screen title: Day 10 · Social Situations"],"highlight":"Help users recognize social pressure as a trigger , without forcing avoidance or confrontation SCREEN 1: DAY INTRO (TEXT) Screen title: Day 10 · Social Situations"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: People and pressure Exercise: Recall one social trigger.","Journal: “Which situations increase urges?” Close: “Awareness creates","choice.”","DAY 10 – SOCIAL SITUATIONS","(Text + Guided Awareness + Reflection)","Total time: 7 – 9 minutes Tone: Supportive, steady, non-confrontational"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 10?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 10 is complete.","secondaryMessage":"Help users recognize social pressure as a trigger , without forcing avoidance or confrontation SCREEN 1: DAY INTRO (TEXT) Screen title: Day 10 · Social Situations"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  11,
  'Energy Levels',
  'Day 11 - Energy Levels',
  '',
  17,
  '[{"type":"intro","dayNumber":11,"dayTitle":"Energy Levels","goal":"Help users recognize fatigue as a trigger , not a failure — and reduce automatic habit responses driven by low energy SCREEN 1: DAY INTRO (TEXT) Screen title: Day 11 · Energy & Fatigue","estimatedMinutes":17},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users recognize fatigue as a trigger , not a failure — and reduce automatic habit responses driven by low energy SCREEN 1: DAY INTRO (TEXT) Screen title: Day 11 · Energy & Fatigue"],"highlight":"Help users recognize fatigue as a trigger , not a failure — and reduce automatic habit responses driven by low energy SCREEN 1: DAY INTRO (TEXT) Screen title: Day 11 · Energy & Fatigue"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Fatigue and urges Exercise: Notice energy morning vs evening.","Journal: “When do I feel most tired?” Close: “Low energy needs rest.”","DAY 11 – ENERGY & FATIGUE","(Text + Guided Awareness + Reflection)","Total time: 6 – 8 minutes Tone: Supportive, grounding, realistic","Goal: Help users recognize fatigue as a trigger , not a failure — and"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 11?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 11 is complete.","secondaryMessage":"Help users recognize fatigue as a trigger , not a failure — and reduce automatic habit responses driven by low energy SCREEN 1: DAY INTRO (TEXT) Screen title: Day 11 · Energy & Fatigue"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  12,
  'Self-Talk',
  'Day 12 - Self-Talk',
  '',
  17,
  '[{"type":"intro","dayNumber":12,"dayTitle":"Self-Talk","goal":"Help users notice how they talk to themselves before, during, and after urges — without trying to “fix” it yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 12 · Self-Talk","estimatedMinutes":17},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users notice how they talk to themselves before, during, and after urges — without trying to “fix” it yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 12 · Self-Talk"],"highlight":"Help users notice how they talk to themselves before, during, and after urges — without trying to “fix” it yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 12 · Self-Talk"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Internal dialogue Exercise: Catch one self-talk phrase today.","Journal: “What did I say to myself?” Close: “Kind language matters.”","DAY 12 – SELF-TALK","(Text + Guided Awareness + Reflection)","Total time: 7 – 9 minutes Tone: Gentle, grounding, non-confrontational","Goal: Help users notice how they talk to themselves before, during, and"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 12?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 12 is complete.","secondaryMessage":"Help users notice how they talk to themselves before, during, and after urges — without trying to “fix” it yet SCREEN 1: DAY INTRO (TEXT) Screen title: Day 12 · Self-Talk"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  13,
  'Environment',
  'Day 13 - Environment',
  '',
  18,
  '[{"type":"intro","dayNumber":13,"dayTitle":"Environment","goal":"Help users recognize how places and environments influence urges , without asking them to avoid life or make drastic changes SCREEN 1: DAY INTRO (TEXT) Screen title: Day 13 · Environment & Places","estimatedMinutes":18},{"type":"lesson","title":"Today''s Focus","paragraphs":["Help users recognize how places and environments influence urges , without asking them to avoid life or make drastic changes SCREEN 1: DAY INTRO (TEXT) Screen title: Day 13 · Environment & Places"],"highlight":"Help users recognize how places and environments influence urges , without asking them to avoid life or make drastic changes SCREEN 1: DAY INTRO (TEXT) Screen title: Day 13 · Environment & Places"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Places that trigger habits Exercise: Notice one location linked","to urges. Journal: “Where do urges appear most?” Close: “Environment","shapes behavior.”","DAY 13 – ENVIRONMENT & PLACES","(Text + Guided Awareness + Reflection)","Total time: 7 – 9 minutes Tone: Observational, grounding, non-blaming"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 13?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 13 is complete.","secondaryMessage":"Help users recognize how places and environments influence urges , without asking them to avoid life or make drastic changes SCREEN 1: DAY INTRO (TEXT) Screen title: Day 13 · Environment & Places"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  14,
  'Weekly Reflection',
  'Day 14 - Weekly Reflection',
  '',
  18,
  '[{"type":"intro","dayNumber":14,"dayTitle":"Weekly Reflection","goal":"Complete Day 14 with steady, consistent action.","estimatedMinutes":18},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 14 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Awareness deepening Exercise: Review last 7 days. Journal:","“What repeats most often?” Close: “You’re learning yourself.”","DAY 14 – WEEKLY REFLECTION","(Phase 1 Close · Full Depth)","Purpose: Close Phase 1 without judgment, create psychological readiness for","structure, and prevent drop-off."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 14?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 14 is complete.","secondaryMessage":"You reinforced weekly reflection today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  15,
  'Early Urge Signals',
  'Day 15 - Early Urge Signals',
  '',
  19,
  '[{"type":"intro","dayNumber":15,"dayTitle":"Early Urge Signals","goal":"Complete Day 15 with steady, consistent action.","estimatedMinutes":19},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 15 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Catching urges early Exercise: Pause at first hint of urge.","Journal: “How early did I notice it?” Close: “Early noticing helps.”","DAY 15 – EARLY URGE SIGNALS","(Text + Guided Awareness + Reflection)","Total time: 7 – 9 minutes Tone: Calm, empowering, steady Goal: Help","users recognize the very first signs of an urge , before it turns intense"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 15?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 15 is complete.","secondaryMessage":"You reinforced early urge signals today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  16,
  'Physical Needs',
  'Day 16 - Physical Needs',
  '',
  19,
  '[{"type":"intro","dayNumber":16,"dayTitle":"Physical Needs","goal":"Complete Day 16 with steady, consistent action.","estimatedMinutes":19},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 16 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Hunger, thirst, sleep Exercise: Drink water mindfully.","Journal: “Was this urge physical?” Close: “Care reduces cravings.”","DAY 16 – PHYSICAL NEEDS","(Full Depth · Audio + Text + Journal)","Focus: Hunger, thirst, rest, physical depletion Goal: Help users","recognize when urges are driven by basic unmet needs , not desire or habit"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 16?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 16 is complete.","secondaryMessage":"You reinforced physical needs today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  17,
  'Mood Shifts',
  'Day 17 - Mood Shifts',
  '',
  20,
  '[{"type":"intro","dayNumber":17,"dayTitle":"Mood Shifts","goal":"Complete Day 17 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 17 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Mood changes Exercise: Notice mood before/after urges.","Journal: “How did my mood change?” Close: “Moods move.”","DAY 17 – MOOD SHIFTS","(Full Depth · Audio + Text + Journal)","Focus: Mood changes before and after urges Goal: Help users notice how","moods shift over time — without labeling, fixing, or suppressing them"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 17?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 17 is complete.","secondaryMessage":"You reinforced mood shifts today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  18,
  'Expectation Release',
  'Day 18 - Expectation Release',
  '',
  20,
  '[{"type":"intro","dayNumber":18,"dayTitle":"Expectation Release","goal":"Reduce pressure that quietly fuels urges; increase flexibility and self-trust Total time: 7 – 9 minutes Tone: Gentle, permission-giving, grounding SCREEN 1: DAY INTRO (TEXT)","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Reduce pressure that quietly fuels urges; increase flexibility and self-trust Total time: 7 – 9 minutes Tone: Gentle, permission-giving, grounding SCREEN 1: DAY INTRO (TEXT)"],"highlight":"Reduce pressure that quietly fuels urges; increase flexibility and self-trust Total time: 7 – 9 minutes Tone: Gentle, permission-giving, grounding SCREEN 1: DAY INTRO (TEXT)"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Letting go of outcomes Exercise: Say: “I don’t need to fix","today.” Journal: “What pressure can I release?” Close: “Ease builds","stability.”","DAY 18 – RELEASING EXPECTATIONS","(Full Depth · Audio + Text + Journal)","Focus: Letting go of rigid expectations about progress, urges, and moods"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 18?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 18 is complete.","secondaryMessage":"Reduce pressure that quietly fuels urges; increase flexibility and self-trust Total time: 7 – 9 minutes Tone: Gentle, permission-giving, grounding SCREEN 1: DAY INTRO (TEXT)"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  19,
  'Control vs Compulsion',
  'Day 19 - Control vs Compulsion',
  '',
  20,
  '[{"type":"intro","dayNumber":19,"dayTitle":"Control vs Compulsion","goal":"Complete Day 19 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 19 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Choice awareness Exercise: Delay one response today. Journal:","“What helped me pause?” Close: “Pause creates space.”","judgmental, app-ready standard of Days 1–18.","This day is very important conceptually. It helps users stop seeing urges as","“loss of control” and start seeing where choice still exists , even in small","ways."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 19?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 19 is complete.","secondaryMessage":"You reinforced control vs compulsion today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  20,
  'Readiness',
  'Day 20 - Readiness',
  '',
  20,
  '[{"type":"intro","dayNumber":20,"dayTitle":"Readiness","goal":"Complete Day 20 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 20 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Preparing for structure Exercise: Visualize handling one urge","calmly. Journal: “What support helps most?” Close: “You’re ready for the","next phase.”","DAY 20 – READINESS","(Full Depth · Audio + Text + Journal)","Focus: Readiness for gentle structure Goal: Help users notice _where_"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 20?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 20 is complete.","secondaryMessage":"You reinforced readiness today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  21,
  'Phase Reflection',
  'Day 21 - Phase Reflection',
  '',
  20,
  '[{"type":"intro","dayNumber":21,"dayTitle":"Phase Reflection","goal":"Replace reactions with simple routines. I’ll continue with the same level of detail but grouped to keep this readable.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Replace reactions with simple routines. I’ll continue with the same level of detail but grouped to keep this readable."],"highlight":"Replace reactions with simple routines. I’ll continue with the same level of detail but grouped to keep this readable."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["Focus: Awareness summary Exercise: Review key patterns. Journal:","“What do I understand now?” Close: “Awareness achieved.”","or changing behavior perfectly.","It was about learning to notice — urges, moods, patterns, and moments with more","clarity.","Today is about recognizing what that awareness has given you."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 21?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 21 is complete.","secondaryMessage":"Replace reactions with simple routines. I’ll continue with the same level of detail but grouped to keep this readable."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  22,
  'INTRODUCING THE PAUSE',
  'Day 22 - INTRODUCING THE PAUSE',
  '',
  20,
  '[{"type":"intro","dayNumber":22,"dayTitle":"INTRODUCING THE PAUSE","goal":"Create space between urge and response — _without trying to stop anything_ Total time: 8 – 10 minutes Tone: Calm, reassuring, permission-giving SCREEN 1: DAY INTRO (TEXT)","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Create space between urge and response — _without trying to stop anything_ Total time: 8 – 10 minutes Tone: Calm, reassuring, permission-giving SCREEN 1: DAY INTRO (TEXT)"],"highlight":"Create space between urge and response — _without trying to stop anything_ Total time: 8 – 10 minutes Tone: Calm, reassuring, permission-giving SCREEN 1: DAY INTRO (TEXT)"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth · Foundational Day)","Focus: Learning what a pause is Core Skill: Delay without pressure","Goal: Create space between urge and response — _without trying to stop","anything_","Total time: 8 – 10 minutes Tone: Calm, reassuring, permission-giving","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 22?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 22 is complete.","secondaryMessage":"Create space between urge and response — _without trying to stop anything_ Total time: 8 – 10 minutes Tone: Calm, reassuring, permission-giving SCREEN 1: DAY INTRO (TEXT)"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  23,
  'STAYING WITH DISCOMFORT',
  'Day 23 - STAYING WITH DISCOMFORT',
  '',
  20,
  '[{"type":"intro","dayNumber":23,"dayTitle":"STAYING WITH DISCOMFORT","goal":"Complete Day 23 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 23 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Allowing discomfort without immediate reaction Core Skill:","Tolerance, not control Goal: Reduce fear of urge sensations","Total time: 8 – 10 minutes Tone: Reassuring, steady, validating","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 23 · Staying with Discomfort"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 23?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 23 is complete.","secondaryMessage":"You reinforced staying with discomfort today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  24,
  'WATCHING THE URGE CHANGE',
  'Day 24 - WATCHING THE URGE CHANGE',
  '',
  20,
  '[{"type":"intro","dayNumber":24,"dayTitle":"WATCHING THE URGE CHANGE","goal":"Complete Day 24 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 24 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Observing how urges shift over time Core Skill: Curiosity instead","of urgency Goal: Break the belief that urges are permanent or commanding","Total time: 8 – 10 minutes Tone: Curious, steady, reassuring","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 24 · Watching the Urge Change"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 24?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 24 is complete.","secondaryMessage":"You reinforced watching the urge change today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  25,
  'PAUSING WITHOUT EXPECTATION',
  'Day 25 - PAUSING WITHOUT EXPECTATION',
  '',
  20,
  '[{"type":"intro","dayNumber":25,"dayTitle":"PAUSING WITHOUT EXPECTATION","goal":"Complete Day 25 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 25 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Letting go of “did it work?” thinking Core Skill: Neutral","practice without outcome pressure Goal: Prevent frustration, self-doubt, and","drop-off","Total time: 8 – 10 minutes Tone: Grounded, freeing, pressure-reducing","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 25?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 25 is complete.","secondaryMessage":"You reinforced pausing without expectation today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  26,
  'PAUSING EARLIER',
  'Day 26 - PAUSING EARLIER',
  '',
  20,
  '[{"type":"intro","dayNumber":26,"dayTitle":"PAUSING EARLIER","goal":"Complete Day 26 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 26 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Catching moments _before_ urgency peaks Core Skill: Early","noticing → early pause Goal: Reduce intensity by intervening sooner, not","harder","Total time: 8 – 10 minutes Tone: Empowering, gentle, confidence-building","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 26?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 26 is complete.","secondaryMessage":"You reinforced pausing earlier today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  27,
  'PAUSING WITH KINDNESS',
  'Day 27 - PAUSING WITH KINDNESS',
  '',
  20,
  '[{"type":"intro","dayNumber":27,"dayTitle":"PAUSING WITH KINDNESS","goal":"Complete Day 27 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 27 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: The _tone_ of the pause Core Skill: Self-kindness during moments","of urge or discomfort Goal: Prevent shame, pressure, and self-criticism from","undermining progress","Total time: 8 – 10 minutes Tone: Warm, reassuring, human","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 27?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 27 is complete.","secondaryMessage":"You reinforced pausing with kindness today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  28,
  'INTEGRATING THE PAUSE',
  'Day 28 - INTEGRATING THE PAUSE',
  '',
  20,
  '[{"type":"intro","dayNumber":28,"dayTitle":"INTEGRATING THE PAUSE","goal":"Complete Day 28 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 28 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth · Wrap-Up Day)","Focus: Integration, not performance Core Skill: Recognizing the pause as","a usable life skill Goal: Help users trust the pause without overusing or","forcing it","Total time: 10 – 12 minutes Tone: Reflective, affirming, steady","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 28?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 28 is complete.","secondaryMessage":"You reinforced integrating the pause today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  29,
  'IDENTIFYING A HIGH-RISK MOMENT',
  'Day 29 - IDENTIFYING A HIGH-RISK MOMENT',
  '',
  20,
  '[{"type":"intro","dayNumber":29,"dayTitle":"IDENTIFYING A HIGH-RISK MOMENT","goal":"Complete Day 29 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 29 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth · Foundation Day)","Focus: Identifying _one_ difficult moment Core Skill: Precision instead","of pressure Goal: Choose a single moment where support will help most","Total time: 8 – 10 minutes Tone: Calm, simplifying, reassuring","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 29 · Identifying a High-Risk Moment"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 29?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 29 is complete.","secondaryMessage":"You reinforced identifying a high-risk moment today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  30,
  'UNDERSTANDING THE HIGH-RISK MOMENT',
  'Day 30 - UNDERSTANDING THE HIGH-RISK MOMENT',
  '',
  20,
  '[{"type":"intro","dayNumber":30,"dayTitle":"UNDERSTANDING THE HIGH-RISK MOMENT","goal":"Complete Day 30 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 30 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Understanding, not fixing Core Skill: Curiosity instead of","self-judgment Goal: See what makes the chosen moment difficult so support","can fit naturally","Total time: 8 – 10 minutes Tone: Curious, validating, explanatory","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 30?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 30 is complete.","secondaryMessage":"You reinforced understanding the high-risk moment today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  31,
  'INTRODUCING A REPLACEMENT ROUTINE',
  'Day 31 - INTRODUCING A REPLACEMENT ROUTINE',
  '',
  20,
  '[{"type":"intro","dayNumber":31,"dayTitle":"INTRODUCING A REPLACEMENT ROUTINE","goal":"Complete Day 31 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 31 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Adding support, not removing habits Core Skill: Gentle","replacement Goal: Introduce one small routine that reduces intensity during","the high-risk moment","Total time: 10 – 12 minutes Tone: Reassuring, practical, non-demanding","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 31?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 31 is complete.","secondaryMessage":"You reinforced introducing a replacement routine today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  32,
  'TRYING THE ROUTINE ONCE',
  'Day 32 - TRYING THE ROUTINE ONCE',
  '',
  20,
  '[{"type":"intro","dayNumber":32,"dayTitle":"TRYING THE ROUTINE ONCE","goal":"Complete Day 32 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 32 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: First real use without expectation Core Skill: Trying without","evaluating Goal: Experience the routine once, without judging outcome","Total time: 8 – 10 minutes Tone: Calm, permissive, reassuring","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 32 · Trying the Routine Once"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 32?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 32 is complete.","secondaryMessage":"You reinforced trying the routine once today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  33,
  'ADJUSTING THE ROUTINE',
  'Day 33 - ADJUSTING THE ROUTINE',
  '',
  20,
  '[{"type":"intro","dayNumber":33,"dayTitle":"ADJUSTING THE ROUTINE","goal":"Complete Day 33 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 33 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Flexibility over correctness Core Skill: Adjusting support","instead of abandoning it Goal: Help the routine fit the user — not the other","way around","Total time: 8 – 10 minutes Tone: Normalizing, empowering, practical","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 33?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 33 is complete.","secondaryMessage":"You reinforced adjusting the routine today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  34,
  'USING THE ROUTINE WITH LESS EFFORT',
  'Day 34 - USING THE ROUTINE WITH LESS EFFORT',
  '',
  20,
  '[{"type":"intro","dayNumber":34,"dayTitle":"USING THE ROUTINE WITH LESS EFFORT","goal":"Complete Day 34 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 34 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth)","Focus: Reducing friction Core Skill: Letting routines feel lighter and","more natural Goal: Make the routine easier to use — not more effective","Total time: 8 – 10 minutes Tone: Reassuring, simplifying, steady","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 34 · Using the Routine with Less Effort"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 34?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 34 is complete.","secondaryMessage":"You reinforced using the routine with less effort today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  35,
  'NOTICING WHAT HELPS',
  'Day 35 - NOTICING WHAT HELPS',
  '',
  20,
  '[{"type":"intro","dayNumber":35,"dayTitle":"NOTICING WHAT HELPS","goal":"Build confidence by noticing subtle shifts Total time: 8 – 10 minutes Tone: Reflective, affirming, calm SCREEN 1: DAY INTRO (TEXT) Screen title: Day 35 · Noticing What Helps","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Build confidence by noticing subtle shifts Total time: 8 – 10 minutes Tone: Reflective, affirming, calm SCREEN 1: DAY INTRO (TEXT) Screen title: Day 35 · Noticing What Helps"],"highlight":"Build confidence by noticing subtle shifts Total time: 8 – 10 minutes Tone: Reflective, affirming, calm SCREEN 1: DAY INTRO (TEXT) Screen title: Day 35 · Noticing What Helps"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Phase 2 · Full Depth · Wrap-Up Day)","Focus: Awareness, not judgment Core Skill: Recognizing helpful support","Goal: Build confidence by noticing subtle shifts","Total time: 8 – 10 minutes Tone: Reflective, affirming, calm","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 35 · Noticing What Helps"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 35?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 35 is complete.","secondaryMessage":"Build confidence by noticing subtle shifts Total time: 8 – 10 minutes Tone: Reflective, affirming, calm SCREEN 1: DAY INTRO (TEXT) Screen title: Day 35 · Noticing What Helps"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  36,
  'RETURNING WITHOUT RESETTING',
  'Day 36 - RETURNING WITHOUT RESETTING',
  '',
  20,
  '[{"type":"intro","dayNumber":36,"dayTitle":"RETURNING WITHOUT RESETTING","goal":"Remove fear of “falling off” and normalize coming back Total time: 8 – 10 minutes Tone: Reassuring, stabilizing, confidence-preserving SCREEN 1: DAY INTRO (TEXT)","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Remove fear of “falling off” and normalize coming back Total time: 8 – 10 minutes Tone: Reassuring, stabilizing, confidence-preserving SCREEN 1: DAY INTRO (TEXT)"],"highlight":"Remove fear of “falling off” and normalize coming back Total time: 8 – 10 minutes Tone: Reassuring, stabilizing, confidence-preserving SCREEN 1: DAY INTRO (TEXT)"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: Continuity, not streaks Core Skill: Returning gently after breaks","Goal: Remove fear of “falling off” and normalize coming back","Total time: 8 – 10 minutes Tone: Reassuring, stabilizing,","confidence-preserving","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 36?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 36 is complete.","secondaryMessage":"Remove fear of “falling off” and normalize coming back Total time: 8 – 10 minutes Tone: Reassuring, stabilizing, confidence-preserving SCREEN 1: DAY INTRO (TEXT)"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  37,
  'HANDLING MISSED MOMENTS WITH CALM',
  'Day 37 - HANDLING MISSED MOMENTS WITH CALM',
  '',
  20,
  '[{"type":"intro","dayNumber":37,"dayTitle":"HANDLING MISSED MOMENTS WITH CALM","goal":"Complete Day 37 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 37 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: Responding calmly after missed moments Core Skill: Emotional","regulation without self-judgment Goal: Break guilt → urgency → repetition","loops","Total time: 8 – 10 minutes Tone: Stabilizing, compassionate, grounding","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 37?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 37 is complete.","secondaryMessage":"You reinforced handling missed moments with calm today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  38,
  'REDUCING ALL-OR-NOTHING THINKING',
  'Day 38 - REDUCING ALL-OR-NOTHING THINKING',
  '',
  20,
  '[{"type":"intro","dayNumber":38,"dayTitle":"REDUCING ALL-OR-NOTHING THINKING","goal":"Prevent “I already messed up” spirals Total time: 8 – 10 minutes Tone: Normalizing, grounding, perspective-building SCREEN 1: DAY INTRO (TEXT)","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Prevent “I already messed up” spirals Total time: 8 – 10 minutes Tone: Normalizing, grounding, perspective-building SCREEN 1: DAY INTRO (TEXT)"],"highlight":"Prevent “I already messed up” spirals Total time: 8 – 10 minutes Tone: Normalizing, grounding, perspective-building SCREEN 1: DAY INTRO (TEXT)"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: Mental flexibility Core Skill: Seeing progress in partial steps","Goal: Prevent “I already messed up” spirals","Total time: 8 – 10 minutes Tone: Normalizing, grounding,","perspective-building","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 38?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 38 is complete.","secondaryMessage":"Prevent “I already messed up” spirals Total time: 8 – 10 minutes Tone: Normalizing, grounding, perspective-building SCREEN 1: DAY INTRO (TEXT)"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  39,
  'CONTINUING AFTER A SLIP',
  'Day 39 - CONTINUING AFTER A SLIP',
  '',
  20,
  '[{"type":"intro","dayNumber":39,"dayTitle":"CONTINUING AFTER A SLIP","goal":"Complete Day 39 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 39 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: What comes next after a slip Core Skill: Non-reactive","continuation Goal: Prevent slips from turning into setbacks","Total time: 8 – 10 minutes Tone: Steady, compassionate, grounding","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 39 · Continuing After a Slip"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 39?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 39 is complete.","secondaryMessage":"You reinforced continuing after a slip today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  40,
  'HANDLING MIXED DAYS CALMLY',
  'Day 40 - HANDLING MIXED DAYS CALMLY',
  '',
  20,
  '[{"type":"intro","dayNumber":40,"dayTitle":"HANDLING MIXED DAYS CALMLY","goal":"Complete Day 40 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 40 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: Neutralizing day-level judgment Core Skill: Holding mixed","experiences without escalation Goal: Prevent emotional overreaction to","imperfect days","Total time: 8 – 10 minutes Tone: Grounded, stabilizing, realistic","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 40?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 40 is complete.","secondaryMessage":"You reinforced handling mixed days calmly today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  41,
  'TRUSTING STEADINESS OVER INTENSITY',
  'Day 41 - TRUSTING STEADINESS OVER INTENSITY',
  '',
  20,
  '[{"type":"intro","dayNumber":41,"dayTitle":"TRUSTING STEADINESS OVER INTENSITY","goal":"Complete Day 41 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 41 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: Valuing steady change instead of emotional highs Core Skill:","Recognizing progress without intensity Goal: Prevent users from abandoning","calm progress in search of dramatic results","Total time: 8 – 10 minutes Tone: Grounded, reassuring,","confidence-building"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 41?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 41 is complete.","secondaryMessage":"You reinforced trusting steadiness over intensity today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  42,
  'STAYING CONSISTENT WITHOUT MONITORING',
  'Day 42 - STAYING CONSISTENT WITHOUT MONITORING',
  '',
  20,
  '[{"type":"intro","dayNumber":42,"dayTitle":"STAYING CONSISTENT WITHOUT MONITORING","goal":"Complete Day 42 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 42 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Consistency Phase · Full Depth)","Focus: Letting go of constant checking Core Skill: Trusting internal","signals instead of tracking Goal: Reduce mental load and prevent burnout","from self-monitoring","Total time: 8 – 10 minutes Tone: Freeing, reassuring,","confidence-affirming"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 42?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 42 is complete.","secondaryMessage":"You reinforced staying consistent without monitoring today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  43,
  'Clear Thinking During
Discomfort',
  'Day 43 - Clear Thinking During
Discomfort',
  '',
  18,
  '[{"type":"intro","dayNumber":43,"dayTitle":"Clear Thinking During\nDiscomfort","goal":"Clear Thinking During Discomfort","estimatedMinutes":18},{"type":"lesson","title":"Today''s Focus","paragraphs":["Clear Thinking During Discomfort"],"highlight":"Clear Thinking During Discomfort"},{"type":"mindfulness_exercise","title":"Guided Meditation","steps":["Find a comfortable place to sit. There","is nothing you need to figure out right now. Just a few quiet minutes to settle.","If it feels okay, gently close your eyes. Or soften your gaze. Take one slow","breath in... And let it go naturally. No need to adjust your breathing. Just","notice it. In... And out... Today is about thinking clearly during discomfort.","Not forcing clarity. Just noticing how thoughts behave. Let your breath continue","at its natural pace. Gently think of a recent moment when you felt","uncomfortable. Stress. Restlessness. Fatigue. Notice what happened to your","thoughts in that moment. Did they speed up? Become more urgent? More narrow?","Stay with that memory gently. In... And out... Discomfort often tightens","thinking.","It creates a sense of immediacy. Now imagine that same moment again. But this","time, imagine slowing your breath slightly. In... And out... Notice how a slower","breath creates space around thoughts. Even slightly. Clear thinking does not","require perfect logic. It begins with slowing the pace. Now gently observe your","thoughts right now. Without trying to change them. Are they quiet? Busy?","Neutral? Just notice. Thoughts move naturally. Like clouds passing. When","discomfort appears, clouds may move faster. But they still move. Stay with your","breath. In... And out... Now imagine discomfort appearing later today. Picture","yourself noticing the first tight thought. Instead of following it immediately,","imagine watching it. Letting it sit for one breath. In...","And out... Notice how that small pause changes the feeling of urgency. Clarity","grows when reaction slows. If your mind says, “I need to solve this now,” notice","that thought gently. And return to the breath. Not all thoughts require action.","Some require observation. Bring your attention back to your body. Feel the","support beneath you. Your breathing steady. Your posture balanced. Even when","thoughts move, your body can remain grounded. Stay here quietly for a few","breaths. In... And out... Clear thinking is not the absence of discomfort. It is","steadiness within it. Take one final slow breath in... And a steady breath out.","Notice the room around you. The surface beneath you. The quiet clarity of this","moment. Discomfort may arise. Thoughts may speed up. And you can remain aware","while they do. Today, you practiced clarity. When you’re ready,","gently open your eyes. Return to your day. One breath creates space. And space","creates clearer thinking. That is enough."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"journal","prompt":"What helped you most on Day 43?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 43 is complete.","secondaryMessage":"Clear Thinking During Discomfort"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  44,
  'Confidence Without Urgency',
  'Day 44 - Confidence Without Urgency',
  '',
  18,
  '[{"type":"intro","dayNumber":44,"dayTitle":"Confidence Without Urgency","goal":"Confidence Without Urgency","estimatedMinutes":18},{"type":"lesson","title":"Today''s Focus","paragraphs":["Confidence Without Urgency"],"highlight":"Confidence Without Urgency"},{"type":"mindfulness_exercise","title":"Guided Meditation","steps":["Find a comfortable place to sit. There is nothing","you need to prove. Just a few quiet minutes to settle. If it feels okay, gently","close your eyes. Or soften your gaze. Take one slow breath in... And let it go","naturally. No need to adjust your breathing. Just notice it. In... And out...","Today is about confidence. Not loud confidence. Not dramatic confidence. Just","quiet steadiness. Let your breath continue at its natural pace. Think back over","the past weeks. You’ve noticed patterns. Urges. Stress. Pauses. Emotions. That","awareness builds familiarity. And familiarity builds quiet confidence. Take a","slow breath in...","And gently out. Confidence does not require urgency. It does not rush. It does","not demand proof. It feels steady. Now gently imagine a recent moment when you","responded with awareness. Even briefly. Picture yourself pausing. Observing.","Staying steady. Notice how that felt. Even subtle steadiness matters. Stay with","that feeling for a few breaths. In... And out... Confidence without urgency","feels grounded. It does not need immediate results. It trusts gradual change.","Now imagine a moment later today when an urge appears. Or pressure rises.","Picture yourself responding calmly. Not tense. Not rushed. Just steady. In...","And out... Notice how that image feels in your body. Is there softness?","Stability?","Neutrality? All responses are welcome. Bring your attention back to your","shoulders. Let them soften slightly. Notice your jaw relaxing. Confidence often","feels relaxed. Not rigid. If your mind says, “I don’t feel confident,” notice","that thought gently. And return to the breath. Confidence grows through","repetition. Through noticing. Through returning. Not through force. Stay here","quietly for a few breaths. In... And out... Quiet confidence is not loud. It","does not announce itself. It feels like this moment. Present. Grounded. Steady.","Take one final slow breath in... And a steady breath out. Notice the room around","you. The surface beneath you. The calm of this moment. Confidence without","urgency grows gradually. And today, you practiced it.","When you’re ready, gently open your eyes. Return to your day. Steady awareness","builds confidence. And that is enough."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"journal","prompt":"What helped you most on Day 44?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 44 is complete.","secondaryMessage":"Confidence Without Urgency"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  45,
  'QUIET STRENGTH',
  'Day 45 - QUIET STRENGTH',
  '',
  20,
  '[{"type":"intro","dayNumber":45,"dayTitle":"QUIET STRENGTH","goal":"Complete Day 45 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 45 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Quiet Strength Phase · Full Depth)","Focus: Recognizing strength that doesn’t announce itself Core Skill:","Trusting internal stability Goal: Help users stop mistaking calm for","stagnation","Total time: 8 – 10 minutes Tone: Grounded, affirming, quietly empowering","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 45?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 45 is complete.","secondaryMessage":"You reinforced quiet strength today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  46,
  'TRUSTING YOURSELF WITHOUT TOOLS',
  'Day 46 - TRUSTING YOURSELF WITHOUT TOOLS',
  '',
  20,
  '[{"type":"intro","dayNumber":46,"dayTitle":"TRUSTING YOURSELF WITHOUT TOOLS","goal":"Complete Day 46 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 46 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Quiet Strength Phase · Full Depth)","Focus: Internalizing skills Core Skill: Acting from awareness without","prompts Goal: Build confidence that support lives _inside_ , not just in the","app","Total time: 8 – 10 minutes Tone: Empowering, steady, reassuring","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 46?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 46 is complete.","secondaryMessage":"You reinforced trusting yourself without tools today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  47,
  'LETTING HABITS FADE NATURALLY',
  'Day 47 - LETTING HABITS FADE NATURALLY',
  '',
  20,
  '[{"type":"intro","dayNumber":47,"dayTitle":"LETTING HABITS FADE NATURALLY","goal":"Complete Day 47 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 47 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Quiet Strength Phase · Full Depth)","Focus: Allowing change instead of forcing it Core Skill:","Non-interference Goal: Reduce struggle by letting habits lose relevance on","their own","Total time: 8 – 10 minutes Tone: Calm, spacious, relieving","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 47?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 47 is complete.","secondaryMessage":"You reinforced letting habits fade naturally today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  48,
  'LIVING WITHOUT CONSTANT REFERENCE',
  'Day 48 - LIVING WITHOUT CONSTANT REFERENCE',
  '',
  20,
  '[{"type":"intro","dayNumber":48,"dayTitle":"LIVING WITHOUT CONSTANT REFERENCE","goal":"Complete Day 48 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 48 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Quiet Strength Phase · Full Depth)","Focus: De-centering the habit Core Skill: Shifting attention back to","life Goal: Reduce mental preoccupation with change itself","Total time: 8 – 10 minutes Tone: Spacious, relieving, forward-looking","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 48 · Living Without Constant Reference"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 48?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 48 is complete.","secondaryMessage":"You reinforced living without constant reference today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  49,
  'QUIET CONFIDENCE',
  'Day 49 - QUIET CONFIDENCE',
  '',
  20,
  '[{"type":"intro","dayNumber":49,"dayTitle":"QUIET CONFIDENCE","goal":"Let users _feel_ readiness without needing proof Total time: 8 – 10 minutes Tone: Grounded, affirming, complete SCREEN 1: DAY INTRO (TEXT) Screen title: Day 49 · Quiet Confidence","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Let users _feel_ readiness without needing proof Total time: 8 – 10 minutes Tone: Grounded, affirming, complete SCREEN 1: DAY INTRO (TEXT) Screen title: Day 49 · Quiet Confidence"],"highlight":"Let users _feel_ readiness without needing proof Total time: 8 – 10 minutes Tone: Grounded, affirming, complete SCREEN 1: DAY INTRO (TEXT) Screen title: Day 49 · Quiet Confidence"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Quiet Strength Phase · Full Depth · Wrap-Up)","Focus: Settled confidence Core Skill: Trusting stability without effort","Goal: Let users _feel_ readiness without needing proof","Total time: 8 – 10 minutes Tone: Grounded, affirming, complete","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 49 · Quiet Confidence"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 49?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 49 is complete.","secondaryMessage":"Let users _feel_ readiness without needing proof Total time: 8 – 10 minutes Tone: Grounded, affirming, complete SCREEN 1: DAY INTRO (TEXT) Screen title: Day 49 · Quiet Confidence"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  50,
  'LIVING NORMALLY WITHOUT EFFORT',
  'Day 50 - LIVING NORMALLY WITHOUT EFFORT',
  '',
  20,
  '[{"type":"intro","dayNumber":50,"dayTitle":"LIVING NORMALLY WITHOUT EFFORT","goal":"Complete Day 50 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 50 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth · Phase Opening)","Focus: Normal life Core Skill: Allowing steadiness to blend into daily","living Goal: Remove the sense that recovery requires ongoing effort","Total time: 6 – 8 minutes Tone: Normalizing, relieving, grounded","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 50 · Living Normally Without Effort"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 50?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 50 is complete.","secondaryMessage":"You reinforced living normally without effort today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  51,
  'HANDLING NORMAL STRESS WITHOUT OLD HABITS',
  'Day 51 - HANDLING NORMAL STRESS WITHOUT OLD HABITS',
  '',
  20,
  '[{"type":"intro","dayNumber":51,"dayTitle":"HANDLING NORMAL STRESS WITHOUT OLD HABITS","goal":"Complete Day 51 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 51 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Everyday stress Core Skill: Letting stress pass without","activating old patterns Goal: Build confidence that stress can exist without","relapse or control","Total time: 6 – 8 minutes Tone: Grounded, realistic, reassuring","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 51?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 51 is complete.","secondaryMessage":"You reinforced handling normal stress without old habits today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  52,
  'LETTING URGES APPEAR WITHOUT MEANING',
  'Day 52 - LETTING URGES APPEAR WITHOUT MEANING',
  '',
  20,
  '[{"type":"intro","dayNumber":52,"dayTitle":"LETTING URGES APPEAR WITHOUT MEANING","goal":"Complete Day 52 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 52 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Neutralizing urge interpretation Core Skill: Allowing urges","without attaching stories Goal: Prevent urges from triggering fear,","analysis, or action","Total time: 6 – 8 minutes Tone: Calm, normalizing, confidence-building","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 52?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 52 is complete.","secondaryMessage":"You reinforced letting urges appear without meaning today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  53,
  'LETTING THOUGHTS PASS WITHOUT ENGAGEMENT',
  'Day 53 - LETTING THOUGHTS PASS WITHOUT ENGAGEMENT',
  '',
  20,
  '[{"type":"intro","dayNumber":53,"dayTitle":"LETTING THOUGHTS PASS WITHOUT ENGAGEMENT","goal":"Reduce mental effort and rumination Total time: 6 – 8 minutes Tone: Light, freeing, neutral SCREEN 1: DAY INTRO (TEXT) Screen title: Day 53 · Letting Thoughts Pass","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Reduce mental effort and rumination Total time: 6 – 8 minutes Tone: Light, freeing, neutral SCREEN 1: DAY INTRO (TEXT) Screen title: Day 53 · Letting Thoughts Pass"],"highlight":"Reduce mental effort and rumination Total time: 6 – 8 minutes Tone: Light, freeing, neutral SCREEN 1: DAY INTRO (TEXT) Screen title: Day 53 · Letting Thoughts Pass"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Disengaging from unhelpful thoughts Core Skill: Non-engagement","Goal: Reduce mental effort and rumination","Total time: 6 – 8 minutes Tone: Light, freeing, neutral","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 53 · Letting Thoughts Pass"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 53?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 53 is complete.","secondaryMessage":"Reduce mental effort and rumination Total time: 6 – 8 minutes Tone: Light, freeing, neutral SCREEN 1: DAY INTRO (TEXT) Screen title: Day 53 · Letting Thoughts Pass"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  54,
  'LIVING WITH MENTAL QUIET',
  'Day 54 - LIVING WITH MENTAL QUIET',
  '',
  20,
  '[{"type":"intro","dayNumber":54,"dayTitle":"LIVING WITH MENTAL QUIET","goal":"Complete Day 54 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 54 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Settled mind states Core Skill: Allowing quiet without searching","for stimulation Goal: Prevent users from reactivating habits to “feel","something”","Total time: 6 – 8 minutes Tone: Spacious, reassuring, grounding","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 54?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 54 is complete.","secondaryMessage":"You reinforced living with mental quiet today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  55,
  'ENJOYING LIFE WITHOUT HABIT COMPARISON',
  'Day 55 - ENJOYING LIFE WITHOUT HABIT COMPARISON',
  '',
  20,
  '[{"type":"intro","dayNumber":55,"dayTitle":"ENJOYING LIFE WITHOUT HABIT COMPARISON","goal":"Prevent nostalgia-driven pull back to old habits Total time: 6 – 8 minutes Tone: Grounded, affirming, freeing SCREEN 1: DAY INTRO (TEXT) Screen title: Day 55 · Enjoying Life Without Comparison","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Prevent nostalgia-driven pull back to old habits Total time: 6 – 8 minutes Tone: Grounded, affirming, freeing SCREEN 1: DAY INTRO (TEXT) Screen title: Day 55 · Enjoying Life Without Comparison"],"highlight":"Prevent nostalgia-driven pull back to old habits Total time: 6 – 8 minutes Tone: Grounded, affirming, freeing SCREEN 1: DAY INTRO (TEXT) Screen title: Day 55 · Enjoying Life Without Comparison"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Letting enjoyment stand on its own Core Skill: Non-comparison","Goal: Prevent nostalgia-driven pull back to old habits","Total time: 6 – 8 minutes Tone: Grounded, affirming, freeing","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 55 · Enjoying Life Without Comparison"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 55?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 55 is complete.","secondaryMessage":"Prevent nostalgia-driven pull back to old habits Total time: 6 – 8 minutes Tone: Grounded, affirming, freeing SCREEN 1: DAY INTRO (TEXT) Screen title: Day 55 · Enjoying Life Without Comparison"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  56,
  'LETTING MOTIVATION COME AND GO',
  'Day 56 - LETTING MOTIVATION COME AND GO',
  '',
  20,
  '[{"type":"intro","dayNumber":56,"dayTitle":"LETTING MOTIVATION COME AND GO","goal":"Complete Day 56 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 56 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Reducing dependence on motivation Core Skill: Continuing without","emotional drive Goal: Prevent dips in motivation from being misread as","danger","Total time: 6 – 8 minutes Tone: Reassuring, steady, pressure-free","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 56?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 56 is complete.","secondaryMessage":"You reinforced letting motivation come and go today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  57,
  'TRUSTING LOW-EFFORT DAYS',
  'Day 57 - TRUSTING LOW-EFFORT DAYS',
  '',
  20,
  '[{"type":"intro","dayNumber":57,"dayTitle":"TRUSTING LOW-EFFORT DAYS","goal":"Complete Day 57 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 57 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Ease instead of effort Core Skill: Trusting stability without","trying Goal: Prevent users from re-adding effort unnecessarily","Total time: 6 – 8 minutes Tone: Reassuring, validating, steady","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 57 · Trusting Low-Effort Days"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 57?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 57 is complete.","secondaryMessage":"You reinforced trusting low-effort days today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  58,
  'LETTING LIFE BE UNEVENTFUL',
  'Day 58 - LETTING LIFE BE UNEVENTFUL',
  '',
  20,
  '[{"type":"intro","dayNumber":58,"dayTitle":"LETTING LIFE BE UNEVENTFUL","goal":"Prevent reintroducing habits to “feel something” Total time: 6 – 8 minutes Tone: Grounded, spacious, reassuring SCREEN 1: DAY INTRO (TEXT) Screen title: Day 58 · Letting Life Be Uneventful","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Prevent reintroducing habits to “feel something” Total time: 6 – 8 minutes Tone: Grounded, spacious, reassuring SCREEN 1: DAY INTRO (TEXT) Screen title: Day 58 · Letting Life Be Uneventful"],"highlight":"Prevent reintroducing habits to “feel something” Total time: 6 – 8 minutes Tone: Grounded, spacious, reassuring SCREEN 1: DAY INTRO (TEXT) Screen title: Day 58 · Letting Life Be Uneventful"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth)","Focus: Comfort with neutrality Core Skill: Allowing calm, ordinary days","Goal: Prevent reintroducing habits to “feel something”","Total time: 6 – 8 minutes Tone: Grounded, spacious, reassuring","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 58 · Letting Life Be Uneventful"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 58?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 58 is complete.","secondaryMessage":"Prevent reintroducing habits to “feel something” Total time: 6 – 8 minutes Tone: Grounded, spacious, reassuring SCREEN 1: DAY INTRO (TEXT) Screen title: Day 58 · Letting Life Be Uneventful"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  59,
  'LONG-TERM STABILITY',
  'Day 59 - LONG-TERM STABILITY',
  '',
  20,
  '[{"type":"intro","dayNumber":59,"dayTitle":"LONG-TERM STABILITY","goal":"Complete Day 59 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 59 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Stability Phase · Full Depth · Program Wrap-Up)","Focus: Carrying stability forward Core Skill: Living without active","recovery focus Goal: Help users trust themselves beyond the program","Total time: 6 – 8 minutes Tone: Grounded, reassuring, complete (not","celebratory)","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 59?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 59 is complete.","secondaryMessage":"You reinforced long-term stability today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  60,
  'CONSOLIDATION & PAUSE',
  'Day 60 - CONSOLIDATION & PAUSE',
  '',
  20,
  '[{"type":"intro","dayNumber":60,"dayTitle":"CONSOLIDATION & PAUSE","goal":"Complete Day 60 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 60 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Full Depth · Integration Day)","Focus: Integration without adding effort Purpose: Let progress _settle_","before moving into confidence-building Tone: Quiet, grounding, affirming","Total time: 8 – 10 minutes","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 60 · Pausing Before the Next Phase"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 60?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 60 is complete.","secondaryMessage":"You reinforced consolidation & pause today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  61,
  'RECOGNIZING STEADINESS',
  'Day 61 - RECOGNIZING STEADINESS',
  '',
  20,
  '[{"type":"intro","dayNumber":61,"dayTitle":"RECOGNIZING STEADINESS","goal":"Complete Day 61 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 61 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth · Phase Opening)","Focus: Confidence through evidence, not emotion Core Skill: Seeing","stability clearly Goal: Help users _recognize_ confidence instead of chasing","it","Total time: 6 – 8 minutes Tone: Grounded, affirming, realistic","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 61?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 61 is complete.","secondaryMessage":"You reinforced recognizing steadiness today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  62,
  'REMEMBERING PAST WINS',
  'Day 62 - REMEMBERING PAST WINS',
  '',
  20,
  '[{"type":"intro","dayNumber":62,"dayTitle":"REMEMBERING PAST WINS","goal":"Strengthen self-trust through lived experience Total time: 6 – 8 minutes Tone: Affirming, realistic, steady SCREEN 1: DAY INTRO (TEXT) Screen title: Day 62 · Remembering Past Wins","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Strengthen self-trust through lived experience Total time: 6 – 8 minutes Tone: Affirming, realistic, steady SCREEN 1: DAY INTRO (TEXT) Screen title: Day 62 · Remembering Past Wins"],"highlight":"Strengthen self-trust through lived experience Total time: 6 – 8 minutes Tone: Affirming, realistic, steady SCREEN 1: DAY INTRO (TEXT) Screen title: Day 62 · Remembering Past Wins"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Grounded confidence Core Skill: Recalling evidence of capability","Goal: Strengthen self-trust through lived experience","Total time: 6 – 8 minutes Tone: Affirming, realistic, steady","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 62 · Remembering Past Wins"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 62?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 62 is complete.","secondaryMessage":"Strengthen self-trust through lived experience Total time: 6 – 8 minutes Tone: Affirming, realistic, steady SCREEN 1: DAY INTRO (TEXT) Screen title: Day 62 · Remembering Past Wins"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  63,
  'RESPONDING WITHOUT THE APP',
  'Day 63 - RESPONDING WITHOUT THE APP',
  '',
  20,
  '[{"type":"intro","dayNumber":63,"dayTitle":"RESPONDING WITHOUT THE APP","goal":"Complete Day 63 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 63 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Internalized skills Core Skill: Self-guided response Goal:","Build confidence in responding without external prompts","Total time: 6 – 8 minutes Tone: Empowering, calm, non-detaching","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 63 · Responding Without the App"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 63?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 63 is complete.","secondaryMessage":"You reinforced responding without the app today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  64,
  'TRUSTING YOURSELF IN NEW SITUATIONS',
  'Day 64 - TRUSTING YOURSELF IN NEW SITUATIONS',
  '',
  20,
  '[{"type":"intro","dayNumber":64,"dayTitle":"TRUSTING YOURSELF IN NEW SITUATIONS","goal":"Complete Day 64 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 64 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Confidence in unfamiliar contexts Core Skill: Generalizing","steadiness Goal: Help users trust themselves outside known environments","Total time: 6 – 8 minutes Tone: Reassuring, expansive, grounded","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 64 · Trusting Yourself in New Situations"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 64?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 64 is complete.","secondaryMessage":"You reinforced trusting yourself in new situations today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  65,
  'STAYING STEADY WITHOUT PLANNING AHEAD',
  'Day 65 - STAYING STEADY WITHOUT PLANNING AHEAD',
  '',
  20,
  '[{"type":"intro","dayNumber":65,"dayTitle":"STAYING STEADY WITHOUT PLANNING AHEAD","goal":"Complete Day 65 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 65 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Trusting spontaneous response Core Skill: Letting go of","pre-planning Goal: Reduce anxiety-driven preparation and future scanning","Total time: 6 – 8 minutes Tone: Calm, freeing, confidence-building","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 65 · Staying Steady Without Planning Ahead"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 65?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 65 is complete.","secondaryMessage":"You reinforced staying steady without planning ahead today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  66,
  'HANDLING UNEXPECTED CHALLENGES CALMLY',
  'Day 66 - HANDLING UNEXPECTED CHALLENGES CALMLY',
  '',
  20,
  '[{"type":"intro","dayNumber":66,"dayTitle":"HANDLING UNEXPECTED CHALLENGES CALMLY","goal":"Complete Day 66 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 66 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Responding to surprise without escalation Core Skill: Flexible","calm Goal: Prevent unexpected events from triggering old reactions","Total time: 6 – 8 minutes Tone: Grounded, reassuring, steady","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 66 · Handling Unexpected Challenges Calmly"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 66?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 66 is complete.","secondaryMessage":"You reinforced handling unexpected challenges calmly today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  67,
  'TRUSTING YOURSELF AFTER SMALL SLIPS',
  'Day 67 - TRUSTING YOURSELF AFTER SMALL SLIPS',
  '',
  20,
  '[{"type":"intro","dayNumber":67,"dayTitle":"TRUSTING YOURSELF AFTER SMALL SLIPS","goal":"Complete Day 67 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 67 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Resilience after imperfection Core Skill: Self-trust following","minor setbacks Goal: Prevent slips from turning into loss of confidence or","escalation","Total time: 6 – 8 minutes Tone: Compassionate, steady, reassuring","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 67?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 67 is complete.","secondaryMessage":"You reinforced trusting yourself after small slips today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  68,
  'LIVING WITHOUT SELF-CHECKING',
  'Day 68 - LIVING WITHOUT SELF-CHECKING',
  '',
  20,
  '[{"type":"intro","dayNumber":68,"dayTitle":"LIVING WITHOUT SELF-CHECKING","goal":"Complete Day 68 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 68 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Reducing self-monitoring Core Skill: Letting attention rest","outward Goal: Prevent subtle anxiety loops created by constant internal","checking","Total time: 6 – 8 minutes Tone: Light, freeing, steady","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 68?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 68 is complete.","secondaryMessage":"You reinforced living without self-checking today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  69,
  'TRUSTING LONG GAPS WITHOUT ATTENTION',
  'Day 69 - TRUSTING LONG GAPS WITHOUT ATTENTION',
  '',
  20,
  '[{"type":"intro","dayNumber":69,"dayTitle":"TRUSTING LONG GAPS WITHOUT ATTENTION","goal":"Complete Day 69 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 69 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Building Phase · Full Depth)","Focus: Confidence across time Core Skill: Trusting continuity without","monitoring Goal: Help users feel safe during long periods of non-attention","Total time: 6 – 8 minutes Tone: Settled, reassuring, expansive","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 69 · Trusting Long Gaps Without Attention"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 69?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 69 is complete.","secondaryMessage":"You reinforced trusting long gaps without attention today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  70,
  'QUIET CONFIDENCE',
  'Day 70 - QUIET CONFIDENCE',
  '',
  20,
  '[{"type":"intro","dayNumber":70,"dayTitle":"QUIET CONFIDENCE","goal":"Complete Day 70 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 70 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Confidence Phase · Final Wrap-Up · Full Depth)","Focus: Integrated confidence Core Skill: Trusting what no longer needs","attention Goal: Close the program without creating dependence or fear of","“ending”","Total time: 6 – 8 minutes Tone: Settled, respectful, complete (not","celebratory)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 70?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 70 is complete.","secondaryMessage":"You reinforced quiet confidence today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  71,
  'LIVING WITHOUT A PROGRAM',
  'Day 71 - LIVING WITHOUT A PROGRAM',
  '',
  20,
  '[{"type":"intro","dayNumber":71,"dayTitle":"LIVING WITHOUT A PROGRAM","goal":"Prevent “What now?” anxiety and reduce reliance on daily guidance Total time: 4 – 6 minutes Tone: Light, respectful, spacious SCREEN 1: DAY INTRO (TEXT) Screen title: Day 71 · Living Without a Program","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Prevent “What now?” anxiety and reduce reliance on daily guidance Total time: 4 – 6 minutes Tone: Light, respectful, spacious SCREEN 1: DAY INTRO (TEXT) Screen title: Day 71 · Living Without a Program"],"highlight":"Prevent “What now?” anxiety and reduce reliance on daily guidance Total time: 4 – 6 minutes Tone: Light, respectful, spacious SCREEN 1: DAY INTRO (TEXT) Screen title: Day 71 · Living Without a Program"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Life beyond structure Core Skill: Trusting self-direction","Goal: Prevent “What now?” anxiety and reduce reliance on daily guidance","Total time: 4 – 6 minutes Tone: Light, respectful, spacious","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 71 · Living Without a Program"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 71?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 71 is complete.","secondaryMessage":"Prevent “What now?” anxiety and reduce reliance on daily guidance Total time: 4 – 6 minutes Tone: Light, respectful, spacious SCREEN 1: DAY INTRO (TEXT) Screen title: Day 71 · Living Without a Program"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  72,
  'LETTING LIFE LEAD',
  'Day 72 - LETTING LIFE LEAD',
  '',
  20,
  '[{"type":"intro","dayNumber":72,"dayTitle":"LETTING LIFE LEAD","goal":"Complete Day 72 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 72 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Following life instead of structure Core Skill: Trusting natural","priorities Goal: Reduce the urge to replace the program with another system","Total time: 4 – 6 minutes Tone: Spacious, grounding, quietly empowering","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 72 · Letting Life Lead"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 72?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 72 is complete.","secondaryMessage":"You reinforced letting life lead today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  73,
  'TRUSTING ORDINARY DAYS',
  'Day 73 - TRUSTING ORDINARY DAYS',
  '',
  20,
  '[{"type":"intro","dayNumber":73,"dayTitle":"TRUSTING ORDINARY DAYS","goal":"Prevent the need for intensity, milestones, or emotional highs Total time: 4 – 6 minutes Tone: Grounded, normalizing, quietly affirming SCREEN 1: DAY INTRO (TEXT) Screen title: Day 73 · Trusting Ordinary Days","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Prevent the need for intensity, milestones, or emotional highs Total time: 4 – 6 minutes Tone: Grounded, normalizing, quietly affirming SCREEN 1: DAY INTRO (TEXT) Screen title: Day 73 · Trusting Ordinary Days"],"highlight":"Prevent the need for intensity, milestones, or emotional highs Total time: 4 – 6 minutes Tone: Grounded, normalizing, quietly affirming SCREEN 1: DAY INTRO (TEXT) Screen title: Day 73 · Trusting Ordinary Days"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Stability in normal life Core Skill: Valuing uneventful days","Goal: Prevent the need for intensity, milestones, or emotional highs","Total time: 4 – 6 minutes Tone: Grounded, normalizing, quietly affirming","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 73 · Trusting Ordinary Days"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 73?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 73 is complete.","secondaryMessage":"Prevent the need for intensity, milestones, or emotional highs Total time: 4 – 6 minutes Tone: Grounded, normalizing, quietly affirming SCREEN 1: DAY INTRO (TEXT) Screen title: Day 73 · Trusting Ordinary Days"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  74,
  'LETTING MOTIVATION FLUCTUATE',
  'Day 74 - LETTING MOTIVATION FLUCTUATE',
  '',
  20,
  '[{"type":"intro","dayNumber":74,"dayTitle":"LETTING MOTIVATION FLUCTUATE","goal":"Complete Day 74 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 74 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Freedom from motivation pressure Core Skill: Trusting stability","on low-motivation days Goal: Prevent relapse driven by “I don’t feel","motivated” thinking","Total time: 4 – 6 minutes Tone: Reassuring, normalizing, steady","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 74?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 74 is complete.","secondaryMessage":"You reinforced letting motivation fluctuate today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  75,
  'TRUSTING LOW-ENERGY DAYS',
  'Day 75 - TRUSTING LOW-ENERGY DAYS',
  '',
  20,
  '[{"type":"intro","dayNumber":75,"dayTitle":"TRUSTING LOW-ENERGY DAYS","goal":"Complete Day 75 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 75 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Stability during low energy Core Skill: Letting energy fluctuate","without compensating Goal: Prevent relapse driven by fatigue, boredom, or","“off” days","Total time: 4 – 6 minutes Tone: Gentle, validating, calming","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 75?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 75 is complete.","secondaryMessage":"You reinforced trusting low-energy days today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  76,
  'LETTING LIFE BE UNEVENTFUL',
  'Day 76 - LETTING LIFE BE UNEVENTFUL',
  '',
  20,
  '[{"type":"intro","dayNumber":76,"dayTitle":"LETTING LIFE BE UNEVENTFUL","goal":"Complete Day 76 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 76 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Comfort with neutrality Core Skill: Allowing calm without seeking","stimulation Goal: Prevent relapse driven by boredom, restlessness, or the","need to “feel something”","Total time: 4 – 6 minutes Tone: Spacious, reassuring, deeply settling","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 76?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 76 is complete.","secondaryMessage":"You reinforced letting life be uneventful today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  77,
  'TRUSTING QUIET WEEKS',
  'Day 77 - TRUSTING QUIET WEEKS',
  '',
  20,
  '[{"type":"intro","dayNumber":77,"dayTitle":"TRUSTING QUIET WEEKS","goal":"Complete Day 77 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 77 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Stability across time Core Skill: Trusting long stretches of","normalcy Goal: Prevent anxiety when weeks pass without reflection or effort","Total time: 4 – 6 minutes Tone: Settled, reassuring, expansive","SCREEN 1: DAY INTRO (TEXT)","Screen title: Day 77 · Trusting Quiet Weeks"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 77?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 77 is complete.","secondaryMessage":"You reinforced trusting quiet weeks today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  78,
  'LIVING WITHOUT A NARRATIVE',
  'Day 78 - LIVING WITHOUT A NARRATIVE',
  '',
  20,
  '[{"type":"intro","dayNumber":78,"dayTitle":"LIVING WITHOUT A NARRATIVE","goal":"Complete Day 78 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 78 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Freedom from self-storytelling Core Skill: Letting identity","settle naturally Goal: Reduce over-meaning, identity fixation, and “recovery","identity” attachment","Total time: 4 – 6 minutes Tone: Spacious, clarifying, quietly liberating","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 78?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 78 is complete.","secondaryMessage":"You reinforced living without a narrative today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  79,
  'TRUSTING IDENTITY WITHOUT LABELS',
  'Day 79 - TRUSTING IDENTITY WITHOUT LABELS',
  '',
  20,
  '[{"type":"intro","dayNumber":79,"dayTitle":"TRUSTING IDENTITY WITHOUT LABELS","goal":"Complete Day 79 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 79 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Program · Full Depth)","Focus: Identity without definition Core Skill: Living without","self-labeling Goal: Prevent subtle pressure to “be” something or maintain an","identity","Total time: 4 – 6 minutes Tone: Grounded, freeing, quietly affirming","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 79?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 79 is complete.","secondaryMessage":"You reinforced trusting identity without labels today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  80,
  'LIVING WITHOUT SELF-DEFINITION',
  'Day 80 - LIVING WITHOUT SELF-DEFINITION',
  '',
  20,
  '[{"type":"intro","dayNumber":80,"dayTitle":"LIVING WITHOUT SELF-DEFINITION","goal":"Complete Day 80 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 80 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Final Integration Day · Full Depth)","Focus: Complete release of identity work Core Skill: Living without","self-concept management Goal: End the journey without creating a “final","version” of the user","Total time: 4 – 6 minutes Tone: Spacious, respectful, complete (not","emotional, not celebratory)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 80?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 80 is complete.","secondaryMessage":"You reinforced living without self-definition today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  81,
  'RETURNING FULLY TO LIFE',
  'Day 81 - RETURNING FULLY TO LIFE',
  '',
  20,
  '[{"type":"intro","dayNumber":81,"dayTitle":"RETURNING FULLY TO LIFE","goal":"Complete Day 81 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 81 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Beyond the Journey · Full Depth)","Focus: Life-first orientation Core Skill: Living without reference to","the journey Goal: Confirm that attention belongs back in daily life, not","self-work","Total time: 3 – 5 minutes Tone: Ordinary, affirming, quietly complete","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 81?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 81 is complete.","secondaryMessage":"You reinforced returning fully to life today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  82,
  'LIVING WITHOUT REFERENCE',
  'Day 82 - LIVING WITHOUT REFERENCE',
  '',
  20,
  '[{"type":"intro","dayNumber":82,"dayTitle":"LIVING WITHOUT REFERENCE","goal":"Release the habit of mentally referencing “before,” “after,” or the program Total time: 3 – 5 minutes Tone: Spacious, neutral, freeing SCREEN 1: DAY INTRO (TEXT)","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Release the habit of mentally referencing “before,” “after,” or the program Total time: 3 – 5 minutes Tone: Spacious, neutral, freeing SCREEN 1: DAY INTRO (TEXT)"],"highlight":"Release the habit of mentally referencing “before,” “after,” or the program Total time: 3 – 5 minutes Tone: Spacious, neutral, freeing SCREEN 1: DAY INTRO (TEXT)"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Beyond the Journey · Full Depth)","Focus: Life without comparison Core Skill: Non-referential living","Goal: Release the habit of mentally referencing “before,” “after,” or the","program","Total time: 3 – 5 minutes Tone: Spacious, neutral, freeing","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 82?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 82 is complete.","secondaryMessage":"Release the habit of mentally referencing “before,” “after,” or the program Total time: 3 – 5 minutes Tone: Spacious, neutral, freeing SCREEN 1: DAY INTRO (TEXT)"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  83,
  'LETTING TIME PASS UNNOTICED',
  'Day 83 - LETTING TIME PASS UNNOTICED',
  '',
  20,
  '[{"type":"intro","dayNumber":83,"dayTitle":"LETTING TIME PASS UNNOTICED","goal":"Complete Day 83 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 83 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Beyond the Journey · Full Depth)","Focus: Ease with unmarked time Core Skill: Releasing time awareness as a","measure Goal: End day-counting, anniversary checking, and “how long has it","been?” thinking","Total time: 3 – 5 minutes Tone: Soft, spacious, almost invisible","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 83?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 83 is complete.","secondaryMessage":"You reinforced letting time pass unnoticed today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  84,
  'LIVING WITHOUT SELF-OBSERVATION',
  'Day 84 - LIVING WITHOUT SELF-OBSERVATION',
  '',
  20,
  '[{"type":"intro","dayNumber":84,"dayTitle":"LIVING WITHOUT SELF-OBSERVATION","goal":"Complete Day 84 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 84 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Beyond the Journey · Full Depth)","Focus: Freedom from self-monitoring Core Skill: Allowing experience","without watching it Goal: End the habit of “checking how I’m doing” in real","time","Total time: 3 – 5 minutes Tone: Quiet, ordinary, spacious","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 84?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 84 is complete.","secondaryMessage":"You reinforced living without self-observation today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  85,
  'TRUSTING LIFE WITHOUT CHECK-INS',
  'Day 85 - TRUSTING LIFE WITHOUT CHECK-INS',
  '',
  20,
  '[{"type":"intro","dayNumber":85,"dayTitle":"TRUSTING LIFE WITHOUT CHECK-INS","goal":"Complete Day 85 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 85 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Beyond the Journey · Full Depth)","Focus: Living without confirmation Core Skill: Letting go of “am I","okay?” checks Goal: End the reflex to seek reassurance, logging, or internal","validation","Total time: 3 – 5 minutes Tone: Calm, ordinary, quietly confident","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 85?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 85 is complete.","secondaryMessage":"You reinforced trusting life without check-ins today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  86,
  'LETTING THE APP FADE',
  'Day 86 - LETTING THE APP FADE',
  '',
  20,
  '[{"type":"intro","dayNumber":86,"dayTitle":"LETTING THE APP FADE","goal":"Complete Day 86 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 86 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Beyond the Journey · Full Depth)","Focus: Releasing external support as a focal point Core Skill: Trusting","internalized stability Goal: Allow the app to become optional, background,","or unused without fear","Total time: 2 – 4 minutes Tone: Quiet, respectful, non-dramatic","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 86?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 86 is complete.","secondaryMessage":"You reinforced letting the app fade today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  87,
  'TRUSTING LIFE WITHOUT SUPPORT',
  'Day 87 - TRUSTING LIFE WITHOUT SUPPORT',
  '',
  20,
  '[{"type":"intro","dayNumber":87,"dayTitle":"TRUSTING LIFE WITHOUT SUPPORT","goal":"Complete Day 87 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 87 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Final Optional Closure · Full Depth)","Focus: Complete self-trust Core Skill: Living without leaning on","systems, tools, or reassurance Goal: End the journey without replacing","support with another structure","Total time: 2 – 4 minutes Tone: Quiet, respectful, complete","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 87?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 87 is complete.","secondaryMessage":"You reinforced trusting life without support today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  88,
  'LIVING WITHOUT RETURN',
  'Day 88 - LIVING WITHOUT RETURN',
  '',
  20,
  '[{"type":"intro","dayNumber":88,"dayTitle":"LIVING WITHOUT RETURN","goal":"End the “just in case I need to come back” mindset Total time: 2 – 3 minutes Tone: Neutral, ordinary, final without ceremony SCREEN 1: DAY INTRO (TEXT)","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["End the “just in case I need to come back” mindset Total time: 2 – 3 minutes Tone: Neutral, ordinary, final without ceremony SCREEN 1: DAY INTRO (TEXT)"],"highlight":"End the “just in case I need to come back” mindset Total time: 2 – 3 minutes Tone: Neutral, ordinary, final without ceremony SCREEN 1: DAY INTRO (TEXT)"},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(True Final Settling · Full Depth)","Focus: Completion without revisiting Core Skill: Trusting non-recurrence","Goal: End the “just in case I need to come back” mindset","Total time: 2 – 3 minutes Tone: Neutral, ordinary, final without","ceremony","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 88?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 88 is complete.","secondaryMessage":"End the “just in case I need to come back” mindset Total time: 2 – 3 minutes Tone: Neutral, ordinary, final without ceremony SCREEN 1: DAY INTRO (TEXT)"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  89,
  'LETTING LIFE CONTINUE WITHOUT MEANING',
  'Day 89 - LETTING LIFE CONTINUE WITHOUT MEANING',
  '',
  20,
  '[{"type":"intro","dayNumber":89,"dayTitle":"LETTING LIFE CONTINUE WITHOUT MEANING","goal":"Complete Day 89 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 89 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Post-Completion · Full Depth)","Focus: Freedom from meaning-making Core Skill: Allowing life to be","ordinary without interpretation Goal: End the habit of asking “What does","this mean?” about calm or stability","Total time: 2 – 3 minutes Tone: Neutral, plain, grounding","SCREEN 1: DAY INTRO (TEXT)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 89?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 89 is complete.","secondaryMessage":"You reinforced letting life continue without meaning today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'ninety_day_transform' LIMIT 1),
  'ninety_day_transform',
  90,
  'LETTING LIFE BE ENOUGH',
  'Day 90 - LETTING LIFE BE ENOUGH',
  '',
  20,
  '[{"type":"intro","dayNumber":90,"dayTitle":"LETTING LIFE BE ENOUGH","goal":"Complete Day 90 with steady, consistent action.","estimatedMinutes":20},{"type":"lesson","title":"Today''s Focus","paragraphs":["Complete Day 90 with steady, consistent action."],"highlight":"Consistency compounds into long-term change."},{"type":"action_step","stepNumber":1,"title":"Apply the Day Plan","instructions":["(Final · Ultra-Minimal)","Focus: Nothing more required Goal: End without instruction, identity, or","takeaway Tone: Plain, quiet, complete","SCREEN 1: TITLE","Day 90 · Letting Life Be Enough","SCREEN 2: SINGLE STATEMENT"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What helped you most on Day 90?","helperText":"Write one or two practical observations.","followUpPrompt":"What will you repeat tomorrow?"},{"type":"close","message":"Day 90 is complete.","secondaryMessage":"You reinforced letting life be enough today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

