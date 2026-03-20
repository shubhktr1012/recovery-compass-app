-- ninety_day_transform seed
-- Source: documents/Sent By Anjan/🧭 RECOVERY COMPASS 90-days Program.md
-- Missing source days not seeded: 43, 44
-- Program catalog days absent from source: 43, 44

BEGIN;

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 1,
  'Arriving (7-minute Guided Meditation) Take A Moment to Sit', 'Day 1 - Arriving (7-minute Guided Meditation) Take A Moment to Sit', '', 8,
  '[{"type":"intro","dayNumber":1,"dayTitle":"Arriving (7-minute Guided Meditation) Take A Moment to Sit","goal":"Routine-based urges","estimatedMinutes":8},{"type":"lesson","title":"Daily Focus","paragraphs":["Routine-based urges"],"highlight":"Routine-based urges"},{"type":"journal","prompt":"What made you start today?","helperText":"There''s no right answer. Write as little or as much as you want — or skip this\nentirely."},{"type":"mindfulness_exercise","title":"Today’s Practice","steps":["Notice one repeated habit moment."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"audio","title":"Guided Meditation","description":"Routine-based urges","audioStoragePath":"audio/90-day/1.mp3","durationSeconds":420},{"type":"lesson","title":"Gentle Reminder","paragraphs":["Habits form quietly."],"highlight":"Habits form quietly."},{"type":"close","message":"You showed up today.","secondaryMessage":"(smaller):\nCome back when it feels right — whether that''s later today or tomorrow."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 2,
  'Noticing Urges (7-minute Guided Meditation) Find A Comfortable Place', 'Day 2 - Noticing Urges (7-minute Guided Meditation) Find A Comfortable Place', '', 8,
  '[{"type":"intro","dayNumber":2,"dayTitle":"Noticing Urges (7-minute Guided Meditation) Find A Comfortable Place","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["At least once today, when an urge appears, pause for a few seconds before responding.","You don''t need to stop the urge. Just notice it."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"When did you notice an urge today?","helperText":"You can describe the time, situation, feeling — or skip this.\nOptional follow-up (collapsed by default):\nWhat was happening just before it appeared?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/2.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Noticing an urge — even once — is a meaningful step.","secondaryMessage":"Awareness grows quietly over time."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 3,
  'Time Patterns (7-minute Guided', 'Day 3 - Time Patterns (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":3,"dayTitle":"Time Patterns (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, try to notice at least one urge and quietly mark the time it appeared.","That''s all."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"When did you notice an urge today?\nSuggested options (tappable, optional):\n- Morning\n- 🌤 Afternoon\n- Evening\n- Night\nOptional follow-up (collapsed):\nWas this time familiar or unexpected?","helperText":"A few words are enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/3.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Time patterns often repeat quietly.","secondaryMessage":"You''re building awareness, one detail at a time."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 4,
  'Emotional Triggers (7-minute Guided Meditation) Find A Comfortable', 'Day 4 - Emotional Triggers (7-minute Guided Meditation) Find A Comfortable', '', 8,
  '[{"type":"intro","dayNumber":4,"dayTitle":"Emotional Triggers (7-minute Guided Meditation) Find A Comfortable","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge appears today, see if you can notice the emotion underneath it.","Selectable emotion tags (optional, multi-select):","Stress","Boredom","Loneliness","Tiredness","Frustration","Neutral / unsure"],"highlight":"When an urge appears today, see if you can notice the emotion underneath it."},{"type":"journal","prompt":"What emotion felt strongest today?\nOptional follow-up (collapsed):\nDid this feeling change during the day?","helperText":"One word is enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/4.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Emotions often show up quietly before urges.","secondaryMessage":"Awareness comes before control."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 5,
  'Body Sensations (7-minute', 'Day 5 - Body Sensations (7-minute', '', 8,
  '[{"type":"intro","dayNumber":5,"dayTitle":"Body Sensations (7-minute","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge appears today, see if you can notice any body sensation that came","just before it.","Selectable body sensations (optional, multi-select):","Tight chest","Restlessness","Jaw or shoulder tension","Fatigue","Empty / numb feeling","No clear sensation"],"highlight":"When an urge appears today, see if you can notice any body sensation that came"},{"type":"journal","prompt":"Did you notice any body signals today?\nOptional follow-up (collapsed):\nWhere did you feel them most?","helperText":"A few words are enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/5.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Your body often reacts before your mind does.","secondaryMessage":"Awareness starts quietly."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 6,
  'Habit', 'Day 6 - Habit', '', 8,
  '[{"type":"intro","dayNumber":6,"dayTitle":"Habit","goal":"First-week awareness","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge or action appears today, see if you can notice whether it felt","automatic.","Selectable habit-moment tags (optional, multi-select):","After waking up","After meals","After work","During breaks","While socializing","Before sleep","Not sure"],"highlight":"When an urge or action appears today, see if you can notice whether it felt"},{"type":"journal","prompt":"Did you notice any moments today that felt automatic?\nOptional follow-up (collapsed):\nWhat usually happens just before those moments?","helperText":"A sentence or two is enough — or skip this entirely."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","instructions":["Review the week calmly."]},{"type":"audio","title":"Guided Meditation","description":"First-week awareness","audioStoragePath":"audio/90-day/6.mp3","durationSeconds":420},{"type":"lesson","title":"Daily Focus","paragraphs":["First-week awareness"],"highlight":"First-week awareness"},{"type":"close","message":"Habits don''t mean you want something.","secondaryMessage":"Awareness comes before change."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 7,
  'Weekly Reflection (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 7 - Weekly Reflection (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":7,"dayTitle":"Weekly Reflection (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Boredom vs desire","estimatedMinutes":8},{"type":"lesson","title":"This Week, You Noticed","paragraphs":["(dynamic, calm):","Over the past week, you''ve been paying attention to:","When urges appear","Emotions that come before them","Body sensations and habit moments","This awareness didn''t require perfection — only honesty.","(No numbers shown here)"],"highlight":"(dynamic, calm):"},{"type":"journal","prompt":"What patterns did you notice this week?\nOptional follow-up prompts (collapsed, user can expand):\n- \"When did urges feel strongest?\"\n- \"What surprised you?\"\n- \"What felt slightly easier than expected?\"","helperText":"A few words are enough — or skip this entirely."},{"type":"lesson","title":"What This Means","paragraphs":["Patterns don''t tell you what to do.","They tell you where to be gentle and where support might help.","Next week, you''ll begin adding light structure — only where it makes sense."],"highlight":"Patterns don''t tell you what to do."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","duration":"30 seconds","instructions":["Sit with boredom for 30 seconds."]},{"type":"audio","title":"Guided Meditation","description":"Boredom vs desire","audioStoragePath":"audio/90-day/7.mp3","durationSeconds":420},{"type":"close","message":"You completed a full week of paying attention.","secondaryMessage":"Rest. Continue when you''re ready."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 8,
  'Stress Signals (7-minute Guided Meditation) Find A', 'Day 8 - Stress Signals (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":8,"dayTitle":"Stress Signals (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"lesson","title":"Today''s Stress Check","paragraphs":["At least once today, quietly notice your stress level.","Selectable options (single select, optional):","Low","Medium","High"],"highlight":"At least once today, quietly notice your stress level."},{"type":"journal","prompt":"How does stress affect you?\nOptional follow-up (collapsed):\nWhen stress rises, what usually changes for you?","helperText":"A few words are enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/8.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Stress isn''t a failure signal.","secondaryMessage":"You don''t need to respond perfectly."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 9,
  'Boredom Awareness (7-minute Guided', 'Day 9 - Boredom Awareness (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":9,"dayTitle":"Boredom Awareness (7-minute Guided","goal":"Fatigue and urges","estimatedMinutes":8},{"type":"lesson","title":"Daily Focus","paragraphs":["Fatigue and urges"],"highlight":"Fatigue and urges"},{"type":"mindfulness_exercise","title":"Today''s Practice","duration":"30 seconds","steps":["At least once today, when you notice boredom, sit with it for about 30 seconds before doing anything else."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What do you usually do when bored?\nOptional follow-up (collapsed):\nDoes boredom often lead to automatic habits for you?","helperText":"A few words are enough — or skip this entirely."},{"type":"mindfulness_exercise","title":"Today’s Practice","steps":["Notice energy morning vs evening."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"audio","title":"Guided Meditation","description":"Fatigue and urges","audioStoragePath":"audio/90-day/9.mp3","durationSeconds":420},{"type":"close","message":"Boredom doesn''t last forever.","secondaryMessage":"Boredom passes."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 10,
  'Social Situations (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 10 - Social Situations (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":10,"dayTitle":"Social Situations (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge appears today, notice whether you''re around others or thinking","about a social situation.","Selectable social context tags (optional, multi-select):","With friends","With family","With colleagues","At a social event","Alone but thinking about others","No social influence noticed"],"highlight":"When an urge appears today, notice whether you''re around others or thinking"},{"type":"journal","prompt":"How do social situations affect your choices?\nOptional follow-up (collapsed):\nAre there certain settings that feel harder than others?","helperText":"A few words are enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/10.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Social influence is powerful — not because you''re weak, but because you''re","secondaryMessage":"Awareness creates choice."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 11,
  'Energy & Fatigue (7-minute Guided', 'Day 11 - Energy & Fatigue (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":11,"dayTitle":"Energy & Fatigue (7-minute Guided","goal":"Internal dialogue","estimatedMinutes":8},{"type":"lesson","title":"Today''s Energy Check","paragraphs":["At least once today, quietly notice your energy level.","Selectable options (single select, optional):","Low","Medium","High"],"highlight":"At least once today, quietly notice your energy level."},{"type":"journal","prompt":"How does low energy affect your choices?\nOptional follow-up (collapsed):\nWhat do you usually reach for when you feel tired?","helperText":"A few words are enough — or skip this entirely."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","instructions":["Catch one self-talk phrase today."]},{"type":"audio","title":"Guided Meditation","description":"Internal dialogue","audioStoragePath":"audio/90-day/11.mp3","durationSeconds":420},{"type":"lesson","title":"Daily Focus","paragraphs":["Internal dialogue"],"highlight":"Internal dialogue"},{"type":"close","message":"Fatigue isn''t a personal flaw.","secondaryMessage":"Energy changes. Awareness helps."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 12,
  'the Small', 'Day 12 - the Small', '', 8,
  '[{"type":"intro","dayNumber":12,"dayTitle":"the Small","goal":"Awareness deepening","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge or difficult moment appears today, see if you can notice how you","speak to yourself.","Selectable self-talk tone tags (optional, multi-select):","Critical (\"Why am I like this?\")","Urgent (\"I need this now.\")","Defeated (\"What''s the point?\")","Neutral (\"This is happening.\")","Supportive (\"I can handle this.\")","Not sure"],"highlight":"When an urge or difficult moment appears today, see if you can notice how you"},{"type":"journal","prompt":"What did you notice about your self-talk today?\nOptional follow-up (collapsed):\nWas it different during urges compared to calm moments?","helperText":"One sentence is enough — or skip this entirely."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","instructions":["Review last 7 days."]},{"type":"audio","title":"Guided Meditation","description":"Awareness deepening","audioStoragePath":"audio/90-day/12.mp3","durationSeconds":420},{"type":"lesson","title":"Daily Focus","paragraphs":["Awareness deepening"],"highlight":"Awareness deepening"},{"type":"close","message":"The way you speak to yourself can either add pressure or create space.","secondaryMessage":"You don''t need to fix it today."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 13,
  'Choice Without Pressure (7-minute Guided Meditation)', 'Day 13 - Choice Without Pressure (7-minute Guided Meditation)', '', 8,
  '[{"type":"intro","dayNumber":13,"dayTitle":"Choice Without Pressure (7-minute Guided Meditation)","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge appears today, notice where you are.","Selectable place tags (optional, multi-select):","At home","In a specific room","At work","In a vehicle","Outdoors","At a social venue","Not sure"],"highlight":"When an urge appears today, notice where you are."},{"type":"journal","prompt":"Are there places where urges feel more automatic?\nOptional follow-up (collapsed):\nWhat usually happens right before you''re in that place?","helperText":"A sentence or two is enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/13.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Environments shape habits quietly.","secondaryMessage":"Awareness creates options."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 14,
  'Two-week Reflection (7-minute Guided Meditation) Find A', 'Day 14 - Two-week Reflection (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":14,"dayTitle":"Two-week Reflection (7-minute Guided Meditation) Find A","goal":"Catching urges early","estimatedMinutes":8},{"type":"journal","prompt":"What patterns have you noticed over the past two weeks?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- \"When did urges feel most automatic?\" - \"What situations felt hardest?\" - \"What surprised you?\""},{"type":"lesson","title":"What Comes Next","paragraphs":["Structure doesn''t mean restriction.","It doesn''t mean control or pressure.","It means adding support in moments that already feel difficult — so you don''t","have to rely on willpower."],"highlight":"Structure doesn''t mean restriction."},{"type":"lesson","title":"What Structure Is Not","paragraphs":["Structure is not:","Forcing yourself","Avoiding life","Being perfect","Removing all urges","Structure is:","Short pauses","Simple routines","Earlier support","Faster recovery"],"highlight":"Structure is not:"},{"type":"mindfulness_exercise","title":"Today’s Practice","steps":["Pause at first hint of urge."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"Permission & Control","paragraphs":["You''ll always stay in control.","You choose:","Which routines to try","When to use support","What feels realistic","Nothing is mandatory. Everything is adjustable."],"highlight":"You''ll always stay in control."},{"type":"audio","title":"Guided Meditation","description":"Catching urges early","audioStoragePath":"audio/90-day/14.mp3","durationSeconds":420},{"type":"close","message":"You''ve completed the awareness phase.","secondaryMessage":"Awareness doesn''t remove urges — it gives you space around them."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 15,
  'Responding Instead of Reacting (7-minute Guided', 'Day 15 - Responding Instead of Reacting (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":15,"dayTitle":"Responding Instead of Reacting (7-minute Guided","goal":"Hunger, thirst, sleep","estimatedMinutes":8},{"type":"lesson","title":"Daily Focus","paragraphs":["Hunger, thirst, sleep"],"highlight":"Hunger, thirst, sleep"},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, when you notice the first hint of an urge, pause for a few seconds before responding.","You don''t need to stop the urge.","Just notice that you caught it early."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How early did you notice the urge today?\nOptional follow-up (collapsed):\nWhat was the first signal you noticed?","helperText":"A few words are enough — or skip this entirely."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","instructions":["Drink water mindfully."]},{"type":"audio","title":"Guided Meditation","description":"Hunger, thirst, sleep","audioStoragePath":"audio/90-day/15.mp3","durationSeconds":420},{"type":"close","message":"Urges feel strongest when they go unnoticed for too long.","secondaryMessage":"Catching them early gives you more choice — without needing force."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 16,
  'Steady', 'Day 16 - Steady', '', 8,
  '[{"type":"intro","dayNumber":16,"dayTitle":"Steady","goal":"Mood changes","estimatedMinutes":8},{"type":"lesson","title":"Today''s Noticing Practice","paragraphs":["When an urge appears today, pause briefly and check in with your body.","Selectable options (multi-select, optional):","Hungry","Thirsty","Tired","Restless","None noticed"],"highlight":"When an urge appears today, pause briefly and check in with your body."},{"type":"journal","prompt":"Did physical needs play a role today?\nOptional follow-up (collapsed):\nWhat did your body seem to need most?","helperText":"A few honest words are enough."},{"type":"mindfulness_exercise","title":"Today’s Practice","steps":["Notice mood before/after urges."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"audio","title":"Guided Meditation","description":"Mood changes","audioStoragePath":"audio/90-day/16.mp3","durationSeconds":420},{"type":"lesson","title":"Daily Focus","paragraphs":["Mood changes"],"highlight":"Mood changes"},{"type":"close","message":"Many urges are requests for care — not cravings.","secondaryMessage":"Simple needs matter."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 17,
  'Familiar Environments (7-minute Guided Meditation)', 'Day 17 - Familiar Environments (7-minute Guided Meditation)', '', 8,
  '[{"type":"intro","dayNumber":17,"dayTitle":"Familiar Environments (7-minute Guided Meditation)","goal":"Choice awareness","estimatedMinutes":8},{"type":"lesson","title":"Daily Focus","paragraphs":["Choice awareness"],"highlight":"Choice awareness"},{"type":"mindfulness_exercise","title":"Today''s Noticing Practice","steps":["When an urge appears today, notice your mood before it starts and again after it passes.","Selectable mood tags (optional, multi-select):","Calm Tense Low Irritable Neutral Unsure"],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did your mood change today?\nOptional follow-up (collapsed):\nDid urges affect your mood as much as you expected?","helperText":"A few words are enough — or skip this entirely."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","instructions":["Delay one response today."]},{"type":"audio","title":"Guided Meditation","description":"Choice awareness","audioStoragePath":"audio/90-day/17.mp3","durationSeconds":420},{"type":"close","message":"Moods are not instructions.","secondaryMessage":"They move, even when we don''t act on them."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 18,
  'Repetition &', 'Day 18 - Repetition &', '', 8,
  '[{"type":"intro","dayNumber":18,"dayTitle":"Repetition &","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["When an urge or difficult moment appears today, see if you can release the expectation that it shouldn''t be happening.","Notice what changes when you stop arguing with the moment."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What expectations did you notice today?\nOptional follow-up (collapsed):\nHow did releasing them affect you?","helperText":"A few honest words are enough."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/18.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Progress doesn''t require pressure.","secondaryMessage":"Ease helps."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 19,
  'Subtle Cravings (7-minute Guided Meditation) Find A Comfortable', 'Day 19 - Subtle Cravings (7-minute Guided Meditation) Find A Comfortable', '', 8,
  '[{"type":"intro","dayNumber":19,"dayTitle":"Subtle Cravings (7-minute Guided Meditation) Find A Comfortable","goal":"Awareness summary","estimatedMinutes":8},{"type":"lesson","title":"Daily Focus","paragraphs":["Awareness summary"],"highlight":"Awareness summary"},{"type":"mindfulness_exercise","title":"Today''s Noticing Practice","steps":["When an urge appears today, see if you can notice even a small moment of pause before responding.","Selectable options (optional):","Noticed a pause Responded automatically Not sure"],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"Did you notice any space between urge and action?\nOptional follow-up (collapsed):\nWhat did that space feel like?","helperText":"A word or two is enough — or skip this entirely."},{"type":"action_step","stepNumber":1,"title":"Today’s Practice","instructions":["Review key patterns."]},{"type":"audio","title":"Guided Meditation","description":"Awareness summary","audioStoragePath":"audio/90-day/19.mp3","durationSeconds":420},{"type":"close","message":"Compulsion feels immediate.","secondaryMessage":"Small spaces matter."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 20,
  'Slowing Down', 'Day 20 - Slowing Down', '', 8,
  '[{"type":"intro","dayNumber":20,"dayTitle":"Slowing Down","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Noticing Practice","steps":["Today, see if you can notice one moment where support might have helped — even a little.","Selectable options (optional):","During stress During boredom During fatigue In a specific place In a social situation Not sure yet"],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"Where might a small amount of support help you right now?\nOptional follow-up (collapsed):\nWhat kind of support feels realistic?","helperText":"One sentence is enough — or skip this entirely."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/20.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Readiness doesn''t mean you have to change everything.","secondaryMessage":"You move at your pace."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 21,
  'Three-week Reflection (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 21 - Three-week Reflection (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":21,"dayTitle":"Three-week Reflection (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"What You''ve Learned","instructions":["Without judging or measuring, see if you can name one thing you understand better now than you did before Phase 1.","Selectable prompts (optional):","When urges usually begin What affects my urges most How moods and energy influence me Where I have small moments of choice Something else"]},{"type":"journal","prompt":"What stands out most from Phase 1 for you?\nOptional follow-up (collapsed):\nDid anything surprise you?","helperText":"A few words are enough — or skip this entirely."},{"type":"lesson","title":"What Comes Next","paragraphs":["Phase 2 will introduce gentle structure — short routines and supports designed","around what you''ve already noticed.","This isn''t about forcing change.","It''s about making difficult moments a little easier to navigate.","Secondary copy:","You''ll stay in control the entire time."],"highlight":"Phase 2 will introduce gentle structure — short routines and supports designed"},{"type":"lesson","title":"Permission & Autonomy (must-have)","paragraphs":["You choose:","What to try","When to use support","What feels realistic","Nothing will be mandatory.","Progress will still move at your pace."],"highlight":"You choose:"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/21.mp3","durationSeconds":420},{"type":"close","message":"That is enough for today.","secondaryMessage":"Create a little more space between the urge and the next action."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 22,
  'Expanding the Pause (7-minute Guided Meditation) Find A', 'Day 22 - Expanding the Pause (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":22,"dayTitle":"Expanding the Pause (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, try pausing once when an urge appears.","The pause can be brief.","Acting after the pause is completely allowed."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did the pause feel like?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did anything shift during the pause? - Did it feel uncomfortable, neutral, or calming?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/22.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"You didn''t try to stop anything today.","secondaryMessage":"Pausing is a beginning."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 23,
  'Responding', 'Day 23 - Responding', '', 8,
  '[{"type":"intro","dayNumber":23,"dayTitle":"Responding","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, try pausing at the first hint of a familiar habit moment.","You don''t need to wait for a strong urge.","Even a brief pause counts."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How early did you notice the moment today?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- What sign did you notice first? - Did pausing earlier feel easier or harder? - Did intensity change later on?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/23.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Pausing earlier doesn''t require more strength.","secondaryMessage":"Earlier noticing helps."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 24,
  'Watching the Urge Change', 'Day 24 - Watching the Urge Change', '', 9,
  '[{"type":"intro","dayNumber":24,"dayTitle":"Watching the Urge Change","goal":"Break the belief that urges are permanent or commanding","estimatedMinutes":9},{"type":"lesson","title":"Day 24 · Watching the Urge Change","paragraphs":["Today is about observing urges as they move and change.","Urges often feel fixed — like they will stay the same unless acted on.","Today''s practice is simply to watch what happens when you give an urge time."],"highlight":"Today is about observing urges as they move and change."},{"type":"mindfulness_exercise","title":"Urges Aren''t Static","steps":["Urges are experiences — not commands.","When urges are rushed, they feel intense and fixed.","When urges are observed, they often shift in intensity, shape, or attention.","Today isn''t about controlling urges.","It''s about noticing how they move."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"mindfulness_exercise","title":"What to Watch for","steps":["When an urge appears, you might notice:","Intensity rising or falling Attention shifting elsewhere Physical sensations changing The urge fading, then returning Any change counts.","Even small shifts matter."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice about watching the urge change today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"action_step","stepNumber":1,"title":"Observing the Urge","instructions":["Use this short guide when an urge appears."]},{"type":"audio","title":"Guided Meditation","description":"Break the belief that urges are permanent or commanding","audioStoragePath":"audio/90-day/24.mp3","durationSeconds":420},{"type":"close","message":"That is enough for today.","secondaryMessage":"Today’s skill: Curiosity instead of urgency."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 25,
  'Pausing Without Expectation', 'Day 25 - Pausing Without Expectation', '', 9,
  '[{"type":"intro","dayNumber":25,"dayTitle":"Pausing Without Expectation","goal":"Prevent frustration, self-doubt, and drop-off","estimatedMinutes":9},{"type":"lesson","title":"Day 25 · Pausing Without Expectation","paragraphs":["Today is about pausing without expecting anything to happen.","Sometimes urges change after a pause.","Sometimes they don''t.","Both are okay.","Today''s practice is about letting the pause be enough — without judging the","result."],"highlight":"Today is about pausing without expecting anything to happen."},{"type":"lesson","title":"When Pauses Feel Disappointing","paragraphs":["It''s common to pause and then think:","\"It didn''t work.\"","But pausing isn''t meant to remove urges every time.","When we expect results, pressure returns — and urgency increases again.","Today is about practicing without measuring success."],"highlight":"- Prevents \"this doesn''t help me\" thinking"},{"type":"mindfulness_exercise","title":"What Counts Today","steps":["Today, success is not:","Feeling calm Reducing intensity Making a \"better\" choice Today, success is simply:","Pausing Noticing Allowing the moment to pass as it is"],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice about pausing without expectation today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"mindfulness_exercise","title":"Pausing Without Waiting for Change","steps":["This pause has no goal.","You''re not waiting for anything to happen."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"audio","title":"Guided Meditation","description":"Prevent frustration, self-doubt, and drop-off","audioStoragePath":"audio/90-day/25.mp3","durationSeconds":420},{"type":"close","message":"That is enough for today.","secondaryMessage":"Today’s skill: Neutral practice without outcome pressure."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 26,
  'Pausing Earlier', 'Day 26 - Pausing Earlier', '', 9,
  '[{"type":"intro","dayNumber":26,"dayTitle":"Pausing Earlier","goal":"Reduce intensity by intervening sooner, not harder","estimatedMinutes":9},{"type":"lesson","title":"Day 26 · Pausing Earlier","paragraphs":["Today is about pausing earlier — before urges feel strong.","Many habits don''t start at the peak of an urge.","They start quietly — in familiar moments, routines, or environments.","Today''s practice is about noticing those earlier signals."],"highlight":"Today is about pausing earlier — before urges feel strong."},{"type":"lesson","title":"Why Earlier Pauses Help","paragraphs":["When urges are strong, pausing can feel difficult.","When urges are just beginning, pausing is often easier.","Earlier pauses don''t require more effort — they require more awareness.","You''ve already been building that awareness."],"highlight":"- Removes pressure"},{"type":"mindfulness_exercise","title":"Early Signals to Notice","steps":["Early signals might include:","Reaching for something automatically Moving toward a familiar place A subtle thought or anticipation A change in mood or energy A familiar time of day These signals are quiet.","That''s why they''re powerful places to pause."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice about pausing earlier today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"mindfulness_exercise","title":"Pausing Before Momentum Builds","steps":["Use this when you notice an early signal — not a strong urge."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"audio","title":"Guided Meditation","description":"Reduce intensity by intervening sooner, not harder","audioStoragePath":"audio/90-day/26.mp3","durationSeconds":420},{"type":"close","message":"That is enough for today.","secondaryMessage":"Today’s skill: Early noticing → early pause."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 27,
  'Consistency Without Force', 'Day 27 - Consistency Without Force', '', 8,
  '[{"type":"intro","dayNumber":27,"dayTitle":"Consistency Without Force","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, when you pause, notice the tone you use with yourself.","If it feels harsh, see if you can soften it — even slightly.","That''s enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did kindness affect the pause?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did the urge feel different? - Did pressure reduce at all? - Did the moment feel more manageable?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/27.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Kindness doesn''t mean letting go.","secondaryMessage":"Kindness supports consistency."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 28,
  'Integrating the Pause', 'Day 28 - Integrating the Pause', '', 11,
  '[{"type":"intro","dayNumber":28,"dayTitle":"Integrating the Pause","goal":"Help users trust the pause without overusing or forcing it","estimatedMinutes":11},{"type":"lesson","title":"Day 28 · Integrating the Pause","paragraphs":["Today brings this week of pausing to a close.","You''re not reviewing how well you did.","You''re noticing what pausing has already given you — even in small ways.","Integration means the skill doesn''t need effort anymore.","It becomes available when needed."],"highlight":"Today brings this week of pausing to a close."},{"type":"mindfulness_exercise","title":"What Pausing Taught You","steps":["Over the past few days, you practiced:","Pausing without stopping Staying with discomfort Watching urges change Pausing without expectation Pausing earlier Pausing with kindness You didn''t need to master these.","You only needed to experience them."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"audio","title":"Letting the Pause Settle","description":"Help users trust the pause without overusing or forcing it","audioStoragePath":"audio/90-day/28.mp3","durationSeconds":420},{"type":"mindfulness_exercise","title":"Using the Pause Naturally","steps":["From today on, pausing doesn''t need to be intentional every time.","You can:","Pause when it helps Skip it when it doesn''t Use it briefly or longer The pause is now a tool — not a task."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did pausing change for you this week?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did anything feel less urgent? - Did you respond differently? - Did your inner tone shift?"},{"type":"lesson","title":"What Comes Next","paragraphs":["Next, you''ll begin adding gentle routines — small supports designed for moments","you already know are difficult.","Routines won''t replace pausing.","They''ll build on it."],"highlight":"Next, you''ll begin adding gentle routines — small supports designed for moments"},{"type":"close","message":"You don''t need to pause more.","secondaryMessage":"Pause week complete."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 29,
  'Renewing', 'Day 29 - Renewing', '', 8,
  '[{"type":"intro","dayNumber":29,"dayTitle":"Renewing","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"journal","prompt":"Which moment feels hardest right now?\nSelectable options (examples):\n- After work\n- Evening / night\n- When stressed\n- When bored\n- Social situations\n- Being alone\n- A specific time or place\n(Allow \"Other\" with text input)","helperText":"You can change this later."},{"type":"journal","prompt":"What makes this moment difficult for you?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Is it about mood, energy, habit, or environment? - Does it feel automatic or emotional?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/29.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"You didn''t try to fix anything today.","secondaryMessage":"One moment is enough."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 30,
  'One-month Reflection (7-minute Guided Meditation) Find A', 'Day 30 - One-month Reflection (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":30,"dayTitle":"One-month Reflection (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, when your high-risk moment appears, see if you can notice what''s present — without trying to change anything.","Awareness comes before support."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What seems to make this moment difficult?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Is it more about energy, mood, or habit? - Does the environment play a role? - Does it feel emotional or automatic?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/30.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"lesson","title":"Why This Matters","paragraphs":["Create a little more space between the urge and the next action."],"highlight":"Create a little more space between the urge and the next action."},{"type":"close","message":"Understanding reduces struggle.","secondaryMessage":"Awareness comes first."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 31,
  'Steady', 'Day 31 - Steady', '', 8,
  '[{"type":"intro","dayNumber":31,"dayTitle":"Steady","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"journal","prompt":"Which routine feels easiest to try?\nExample options (show 5–7 max):\n- Drink a glass of water\n- Step outside briefly\n- Stretch shoulders or neck\n- Take 5 slow breaths\n- Wash hands mindfully\n- Sit quietly for one minute\n- Change rooms","helperText":"You can change this later."},{"type":"lesson","title":"Your Routine","paragraphs":["You''ll use this routine during your chosen moment — not every time, just when it","feels helpful.","Optional toggles:","Reminder (off by default)","Duration (30–90 seconds)","Silent / audio guidance"],"highlight":"You''ll use this routine during your chosen moment — not every time, just when it"},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, if your high-risk moment appears, try your routine once.","If the moment doesn''t appear, that''s okay.","You''re learning the routine — not forcing it."]},{"type":"journal","prompt":"How did the routine affect the moment?","helperText":"One sentence is enough — or skip this entirely.","followUpPrompt":"- Did intensity change at all? - Did it slow things down? - Did it feel awkward, neutral, or supportive?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/31.mp3","durationSeconds":420},{"type":"close","message":"You didn''t try to fix a habit today.","secondaryMessage":"Simple routines work."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 32,
  'CALM Decision-making (7-minute Guided', 'Day 32 - CALM Decision-making (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":32,"dayTitle":"CALM Decision-making (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, if your high-risk moment appears, try your routine once.","If the moment doesn''t appear, that''s okay.","You''re learning what the routine feels like."]},{"type":"journal","prompt":"What stood out about calm decision-making (7-minute guided today?","helperText":"A few honest words are enough."},{"type":"journal","prompt":"What was it like to try the routine?","helperText":"One sentence is enough — or skip this entirely.","followUpPrompt":"- Did anything surprise you? - Did it feel easy, strange, or neutral?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/32.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Trying once is progress.","secondaryMessage":"One try is enough."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 33,
  'Staying Present in Difficult Moments', 'Day 33 - Staying Present in Difficult Moments', '', 8,
  '[{"type":"intro","dayNumber":33,"dayTitle":"Staying Present in Difficult Moments","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"journal","prompt":"What would make the routine easier?\nSelectable options (examples):\n- Shorten it\n- Use it earlier\n- Change where I do it\n- Switch to a different routine\n- Remove reminders\n- Keep it the same","helperText":"You can change this again later."},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, try the routine with your adjustment — just once, without evaluating it.","The goal is ease, not effectiveness."]},{"type":"journal","prompt":"How did the adjustment change the experience?","helperText":"One sentence is enough — or skip this entirely.","followUpPrompt":"- Did it feel easier to start? - Did it feel more natural? - Did it reduce friction at all?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/33.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Adjusting doesn''t mean something was wrong.","secondaryMessage":"Adjustment is progress."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 34,
  'Emotional Steadiness (7-minute', 'Day 34 - Emotional Steadiness (7-minute', '', 8,
  '[{"type":"intro","dayNumber":34,"dayTitle":"Emotional Steadiness (7-minute","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"journal","prompt":"What would reduce effort most?\nSelectable options (examples):\n- Shorten it further\n- Do only the first step\n- Remove guidance/audio\n- Tie it to an existing habit\n- Let it be optional\n- Keep it the same","helperText":"Easier routines are used more often."},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, use your routine in its easier form — even if it feels very small.","Small routines done consistently are more powerful than bigger routines done rarely."]},{"type":"journal","prompt":"How did reducing effort change the experience?","helperText":"One sentence is enough — or skip this entirely.","followUpPrompt":"- Did it feel easier to start? - Did resistance reduce? - Did it feel more natural?"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/34.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Routines don''t need effort to help.","secondaryMessage":"Ease builds consistency."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 35,
  'Expanding Inner Stability (7-minute Guided Meditation) Find', 'Day 35 - Expanding Inner Stability (7-minute Guided Meditation) Find', '', 8,
  '[{"type":"intro","dayNumber":35,"dayTitle":"Expanding Inner Stability (7-minute Guided Meditation) Find","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, simply notice what felt supportive this week.","You''re not locking anything in.","You''re observing what your system responds to best."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What helped you most this week?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Was it the pause, the routine, or timing? - Did anything surprise you? - Did ease increase over time?"},{"type":"lesson","title":"Carrying This Forward","paragraphs":["From here on, you don''t need to add more tools.","You''ll continue using what helps — and letting go of what doesn''t.","Support becomes personal when it''s chosen this way."],"highlight":"From here on, you don''t need to add more tools."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/35.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You noticed what helps.","secondaryMessage":"Routine foundation complete."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 36,
  'Clearer Boundaries With', 'Day 36 - Clearer Boundaries With', '', 8,
  '[{"type":"intro","dayNumber":36,"dayTitle":"Clearer Boundaries With","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, practice returning.","If you''ve been consistent, return anyway.","If you''ve missed days, return without explanation.","Returning is enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What helps you return when things feel off?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- What makes returning harder? - What makes it easier? - How does it feel to return without pressure?"},{"type":"lesson","title":"What Consistency Really Means","paragraphs":["Consistency isn''t a streak.","It''s a pattern of returning.","The faster you return, the steadier things become.","Even if returns are imperfect."],"highlight":"Consistency isn''t a streak."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/36.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Nothing needs to be restarted.","secondaryMessage":"Returning builds stability."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 37,
  'Strengthening Self-trust (7-minute Guided Meditation) Find', 'Day 37 - Strengthening Self-trust (7-minute Guided Meditation) Find', '', 8,
  '[{"type":"intro","dayNumber":37,"dayTitle":"Strengthening Self-trust (7-minute Guided Meditation) Find","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, if you notice a missed moment, respond with calm — not correction.","No explanations.","No promises.","Just return."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did responding calmly change the moment?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did guilt reduce? - Did urgency settle faster? - Did returning feel easier?"},{"type":"lesson","title":"CALM Builds Stability","paragraphs":["Stability isn''t built by avoiding mistakes.","It''s built by how gently you respond when they happen.","Calm responses reduce repetition more than strict rules ever could."],"highlight":"Stability isn''t built by avoiding mistakes."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/37.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You handled difficulty with calm today.","secondaryMessage":"Calm supports consistency."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 38,
  'Strengthening Inner Direction (7-minute Guided Meditation) Find A', 'Day 38 - Strengthening Inner Direction (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":38,"dayTitle":"Strengthening Inner Direction (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice any all-or-nothing thoughts.","You don''t need to argue with them.","Just gently add: \"Some progress still counts.\" That''s enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"Where did you notice \"all or nothing\" thinking today?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- How did flexibility change the moment? - Did returning feel easier? - Did pressure reduce at all?"},{"type":"lesson","title":"Progress Is Not Erased","paragraphs":["One moment doesn''t define a day.","One day doesn''t define a week.","Progress accumulates even when things aren''t perfect.","You don''t lose what you''ve built because of one moment."],"highlight":"One moment doesn''t define a day."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/38.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Letting go of extremes creates steadiness.","secondaryMessage":"Flexibility supports consistency."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 39,
  'Balanced Effort (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 39 - Balanced Effort (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":39,"dayTitle":"Balanced Effort (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, if a slip happens, practice continuing — without punishment and without excuses.","Continue with awareness.","That''s enough."]},{"type":"journal","prompt":"How did continuing calmly change the experience?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did guilt reduce? - Did the urge to give up lessen? - Did returning feel easier?"},{"type":"lesson","title":"Continuation Is Strength","paragraphs":["Strength isn''t avoiding slips.","Strength is continuing without making them bigger.","Calm continuation protects what you''ve built."],"highlight":"Strength isn''t avoiding slips."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/39.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You practiced continuing today.","secondaryMessage":"Continuation builds stability."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 40,
  'Six-week Reflection (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 40 - Six-week Reflection (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":40,"dayTitle":"Six-week Reflection (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, if you notice the urge to judge the day, pause and remind yourself:","\"This day can be mixed.\" That''s enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What parts of today felt steady, even briefly?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- What parts felt difficult? - How did holding both feel? - Did pressure reduce when you didn''t label the day?"},{"type":"lesson","title":"Mixed Days Still Count","paragraphs":["Progress doesn''t require perfect days.","It requires staying present through mixed ones.","Calm steadiness builds over time — not from flawless stretches."],"highlight":"Progress doesn''t require perfect days."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/40.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You held a mixed day with calm today.","secondaryMessage":"Mixed days build strength."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 41,
  'CALM Under Pressure (7-minute Guided Meditation) Find A', 'Day 41 - CALM Under Pressure (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":41,"dayTitle":"CALM Under Pressure (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice any urge to look for intensity.","When it appears, gently remind yourself:","\"Steady is enough.\" That''s the practice."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"Where did you notice steadiness recently?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did anything feel less urgent? - Did reactions feel calmer? - Did you recover faster from difficulty?"},{"type":"lesson","title":"Steady Beats Intense","paragraphs":["Intensity fades.","Steadiness stays.","Progress that feels calm is progress you can live with.","You don''t need to feel different every day to be changing."],"highlight":"Intensity fades."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/41.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted steadiness today.","secondaryMessage":"Steadiness builds resilience."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 42,
  'Stability During Urges (7-minute Guided', 'Day 42 - Stability During Urges (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":42,"dayTitle":"Stability During Urges (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, practice not checking.","No reviewing stats.","No measuring the day.","Just live the day and allow steadiness to happen."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did it feel to check less today?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did pressure reduce? - Did you feel more relaxed? - Did anything change unexpectedly?"},{"type":"lesson","title":"Consistency Doesn''t Need Supervision","paragraphs":["You don''t need to watch consistency for it to continue.","Skills you''ve practiced don''t disappear when attention shifts.","Letting go of monitoring is a sign of trust — not neglect."],"highlight":"You don''t need to watch consistency for it to continue."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/42.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed progress to carry itself today.","secondaryMessage":"Steadiness is becoming natural."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 45,
  'Midpoint Reflection (7-minute', 'Day 45 - Midpoint Reflection (7-minute', '', 8,
  '[{"type":"intro","dayNumber":45,"dayTitle":"Midpoint Reflection (7-minute","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice moments where things feel steady without effort.","Don''t try to increase them.","Just recognize them when they appear."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"Where did you notice quiet strength recently?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did anything feel easier than before? - Did urges pass with less attention? - Did calm feel unfamiliar or normal?"},{"type":"lesson","title":"Strength Doesn''t Need Effort","paragraphs":["You don''t need to hold yourself together for strength to exist.","What you''ve practiced is beginning to support you on its own.","That''s not loss of control — it''s integration."],"highlight":"You don''t need to hold yourself together for strength to exist."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/45.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Quiet strength doesn''t demand proof.","secondaryMessage":"Stability is strength."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 46,
  'Long-term', 'Day 46 - Long-term', '', 8,
  '[{"type":"intro","dayNumber":46,"dayTitle":"Long-term","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow yourself to respond naturally — without using tools first.","If you need support, it''s still available.","But notice what you can do on your own."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"Where did you trust yourself today?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did anything surprise you? - Did it feel easier than expected? - Did confidence feel quiet or obvious?"},{"type":"lesson","title":"Support Doesn''t Disappear","paragraphs":["Trusting yourself doesn''t mean losing support.","It means you choose when to use it.","Independence is not absence — it''s flexibility."],"highlight":"Trusting yourself doesn''t mean losing support."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/46.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted yourself today.","secondaryMessage":"Self-trust is forming."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 47,
  'Identity Through Repetition (7-minute Guided Meditation) Find A', 'Day 47 - Identity Through Repetition (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":47,"dayTitle":"Identity Through Repetition (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice a habit without trying to fix it.","Reduce effort.","Reduce attention.","Let it be less central to your day."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What happens when you stop trying to change the habit?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did pressure reduce? - Did attention shift more easily? - Did the habit feel less urgent?"},{"type":"lesson","title":"Change Doesn''t Need Force","paragraphs":["You don''t need to make habits disappear for progress to continue.","Habits lose strength when they''re no longer needed.","Letting go happens naturally when pressure leaves."],"highlight":"You don''t need to make habits disappear for progress to continue."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/47.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed change instead of forcing it today.","secondaryMessage":"Ease supports change."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 48,
  'Living', 'Day 48 - Living', '', 8,
  '[{"type":"intro","dayNumber":48,"dayTitle":"Living","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, let your day unfold without referencing the habit unless it naturally appears.","No checking.","No managing.","Just living."]},{"type":"journal","prompt":"What did you notice when you thought about the habit less?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- Did anything feel lighter? - Did life feel more present? - Did attention shift easily or slowly?"},{"type":"lesson","title":"Life Becomes Central Again","paragraphs":["Habits fade most completely when they''re no longer central.","Change doesn''t require constant reference.","You''re allowed to move on."],"highlight":"Habits fade most completely when they''re no longer central."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/48.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You made room for life today.","secondaryMessage":"Space creates freedom."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 49,
  'Protecting Your Stability (7-minute Guided Meditation) Find A', 'Day 49 - Protecting Your Stability (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":49,"dayTitle":"Protecting Your Stability (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, don''t try to improve anything.","Just notice how you move through the day with what you''ve learned.","That noticing is enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What feels steadier now compared to before?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- What feels less effortful? - What feels less important than it used to? - What feels more neutral?"},{"type":"lesson","title":"Moving Forward","paragraphs":["From here, progress continues without needing daily attention.","You don''t need to manage change for it to remain.","Support is available — but not required.","You''re entering a phase of stability."],"highlight":"From here, progress continues without needing daily attention."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/49.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You don''t need to feel confident for confidence to exist.","secondaryMessage":"Stability begins here."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 50,
  'Stability in Social Situations (7-minute Guided Meditation) Find A', 'Day 50 - Stability in Social Situations (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":50,"dayTitle":"Stability in Social Situations (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, live your day without adjusting it for recovery.","No special focus.","No checking.","No improving.","Just live."]},{"type":"journal","prompt":"What felt normal today?","helperText":"One sentence is enough — or skip entirely.","followUpPrompt":"- What took your attention naturally? - Did anything feel easier than before? - Did you think less about habits?"},{"type":"lesson","title":"Stability Is Quiet","paragraphs":["Stability doesn''t announce itself.","It shows up as:","Less effort","Less focus","Less urgency","When life feels normal again, change is already integrated."],"highlight":"Stability doesn''t announce itself."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/50.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived normally today.","secondaryMessage":"Normal life supports lasting change."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 51,
  'Handling Unexpected Situations (7-minute Guided Meditation) Find A', 'Day 51 - Handling Unexpected Situations (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":51,"dayTitle":"Handling Unexpected Situations (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, when normal stress appears:","Don''t fix it Don''t avoid it Don''t judge it Let it exist while you continue your day."]},{"type":"journal","prompt":"How did stress feel different today compared to before?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did urgency reduce? - Did stress pass on its own? - Did you feel more capable?"},{"type":"lesson","title":"Stress Doesn''t Control You","paragraphs":["Stress used to signal danger.","Now it''s just information.","You don''t need to remove stress to live steadily.","You only need to stop letting it decide your response."],"highlight":"Stress used to signal danger."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/51.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed stress without old habits today.","secondaryMessage":"Stress can pass without control."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 52,
  'Letting Go of Control (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 52 - Letting Go of Control (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":52,"dayTitle":"Letting Go of Control (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, if an urge appears:","Don''t assign meaning Don''t evaluate it Don''t respond immediately Let it exist while you continue living."]},{"type":"journal","prompt":"What changed when you didn''t assign meaning to an urge?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did urgency reduce? - Did the urge pass faster? - Did you feel more neutral?"},{"type":"lesson","title":"Urges Don''t Define Direction","paragraphs":["Urges don''t mean you''re moving backward.","They don''t mean you''re at risk.","They don''t need interpretation.","When urges lose meaning, they lose power."],"highlight":"Urges don''t mean you''re moving backward."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/52.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed an urge without reacting today.","secondaryMessage":"Neutrality brings freedom."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 53,
  'Trusting the Process', 'Day 53 - Trusting the Process', '', 8,
  '[{"type":"intro","dayNumber":53,"dayTitle":"Trusting the Process","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, when a thought appears:","Don''t answer it Don''t correct it Don''t reassure it Let it pass while you continue your day."]},{"type":"journal","prompt":"What changed when you didn''t engage with a thought?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did the thought fade faster? - Did mental tension reduce? - Did focus return more easily?"},{"type":"lesson","title":"Thoughts Don''t Need Management","paragraphs":["You don''t need to manage your mind for stability to continue.","Thoughts come and go without affecting progress.","Engagement gives thoughts weight.","Non-engagement lets them dissolve."],"highlight":"You don''t need to manage your mind for stability to continue."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/53.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed thoughts to pass without effort today.","secondaryMessage":"Ease supports clarity."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 54,
  'Patience With Long-term Change (7-minute Guided Meditation) Find A', 'Day 54 - Patience With Long-term Change (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":54,"dayTitle":"Patience With Long-term Change (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, when things feel quiet:","Don''t rush to fill it Don''t judge it Don''t label it as boring Let quiet be part of your day."]},{"type":"journal","prompt":"How did mental quiet feel today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Comfortable or unfamiliar? - Peaceful or neutral? - Did you feel the urge to fill it?"},{"type":"lesson","title":"Quiet Is A Foundation","paragraphs":["Mental quiet doesn''t stop life.","It supports it.","From quiet, attention moves naturally toward what matters.","You don''t need noise to feel alive."],"highlight":"Mental quiet doesn''t stop life."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/54.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed quiet without reacting today.","secondaryMessage":"Quiet builds ease."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 55,
  'Living Without Constant', 'Day 55 - Living Without Constant', '', 8,
  '[{"type":"intro","dayNumber":55,"dayTitle":"Living Without Constant","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, when you enjoy something:","Don''t compare it Don''t measure it Don''t evaluate it Let the moment stand on its own."]},{"type":"journal","prompt":"What changed when you stopped comparing enjoyment?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did the moment feel fuller? - Did pressure reduce? - Did enjoyment last longer?"},{"type":"lesson","title":"Life Doesn''t Need Enhancement","paragraphs":["Life doesn''t need to feel intense to be meaningful.","Enjoyment doesn''t need to match the past.","When comparison stops, satisfaction becomes simpler."],"highlight":"Life doesn''t need to feel intense to be meaningful."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/55.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed enjoyment without comparison today.","secondaryMessage":"Simplicity supports peace."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 56,
  'Returning to Simplicity (7-minute Guided Meditation) Find A Comfortable', 'Day 56 - Returning to Simplicity (7-minute Guided Meditation) Find A Comfortable', '', 8,
  '[{"type":"intro","dayNumber":56,"dayTitle":"Returning to Simplicity (7-minute Guided Meditation) Find A Comfortable","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t check how motivated you feel.","Let the day unfold regardless of energy or enthusiasm.","Stability doesn''t require motivation to function."]},{"type":"journal","prompt":"What changed when you stopped monitoring motivation?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did pressure reduce? - Did things feel easier? - Did you continue anyway?"},{"type":"lesson","title":"Motivation Is Not A Requirement","paragraphs":["Motivation is a feeling — not a foundation.","Stability rests on patterns, not emotions.","You don''t need to feel motivated to live steadily."],"highlight":"Motivation is a feeling — not a foundation."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/56.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed motivation to come and go today.","secondaryMessage":"Stability doesn''t depend on feelings."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 57,
  'Natural Confidence (7-minute Guided Meditation) Find A Comfortable Place to', 'Day 57 - Natural Confidence (7-minute Guided Meditation) Find A Comfortable Place to', '', 8,
  '[{"type":"intro","dayNumber":57,"dayTitle":"Natural Confidence (7-minute Guided Meditation) Find A Comfortable Place to","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t add effort just to feel productive.","Let the day remain simple.","Let responses stay natural.","Trust what requires very little from you."]},{"type":"journal","prompt":"How did it feel to not try today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did ease feel comfortable or strange? - Did anything still work without effort? - Did you feel tempted to \"do more\"?"},{"type":"lesson","title":"Effort Isn''t Proof","paragraphs":["Effort doesn''t equal progress.","Calm continuation does.","What feels easy is often what lasts.","You don''t need to struggle for stability to continue."],"highlight":"Effort doesn''t equal progress."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/57.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted a low-effort day today.","secondaryMessage":"Stability works quietly."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 58,
  'Living Without Inner', 'Day 58 - Living Without Inner', '', 8,
  '[{"type":"intro","dayNumber":58,"dayTitle":"Living Without Inner","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow parts of your day to remain uneventful.","Don''t fill the space.","Don''t create urgency.","Let ordinary moments pass without interruption."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did uneventful moments feel today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Comfortable or restless? - Did you try to add stimulation? - Did calm settle on its own?"},{"type":"lesson","title":"Ordinary Is A Foundation","paragraphs":["A steady life isn''t dramatic.","It''s predictable.","Repetitive.","Uneventful.","From that foundation, meaningful moments arise naturally."],"highlight":"A steady life isn''t dramatic."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/58.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed life to be uneventful today.","secondaryMessage":"Calm is sustainable."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 59,
  'Stability Without Effort (7-minute Guided Meditation) Find A', 'Day 59 - Stability Without Effort (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":59,"dayTitle":"Stability Without Effort (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t practice anything.","Just live your day as you normally would.","If support is needed, it''s available.","If not, that''s okay too."]},{"type":"journal","prompt":"What feels different now compared to when you began?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- What feels less important? - What feels easier? - What feels more stable?"},{"type":"lesson","title":"Moving Forward From Here","paragraphs":["From here, life continues without a program guiding each step.","Support remains available — but it no longer needs to be central.","You don''t need to \"stay in recovery.\"","You''re simply living."],"highlight":"From here, life continues without a program guiding each step."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/59.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Long-term stability doesn''t announce itself.","secondaryMessage":"Stability carries itself."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 60,
  'Two-month', 'Day 60 - Two-month', '', 8,
  '[{"type":"intro","dayNumber":60,"dayTitle":"Two-month","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Noticing Without Effort","steps":["Today, notice how you move through the day without trying to manage anything.","Pay attention to:","How you respond How quickly things pass How you recover There''s nothing to fix."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What feels more settled now than before?","helperText":"A few words are enough — or skip this entirely.","followUpPrompt":"- What feels less urgent? - What feels more familiar or steady? - What feels easier without effort?"},{"type":"lesson","title":"Moving Forward","paragraphs":["The next phase will focus on confidence — not confidence that everything is","solved, but confidence that you can handle moments as they arise.","You''re not starting something new.","You''re building on what''s already there."],"highlight":"The next phase will focus on confidence — not confidence that everything is"},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/60.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You don''t need to push progress forward.","secondaryMessage":"Pause completed."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 61,
  'Integration Into Daily Life (7-minute Guided', 'Day 61 - Integration Into Daily Life (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":61,"dayTitle":"Integration Into Daily Life (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice moments where:","You handled something calmly You didn''t overthink You trusted yourself No need to record them.","Just notice."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What shows you''re steadier than before?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- What feels less reactive? - What feels more automatic? - What worries you less?"},{"type":"lesson","title":"Confidence Is Functional","paragraphs":["Confidence doesn''t mean you''ll never struggle again.","It means you trust your ability to respond.","That trust is already forming."],"highlight":"Confidence doesn''t mean you''ll never struggle again."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/61.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You recognized steadiness today.","secondaryMessage":"Steadiness builds trust."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 62,
  'Living Calmly', 'Day 62 - Living Calmly', '', 8,
  '[{"type":"intro","dayNumber":62,"dayTitle":"Living Calmly","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice one past win — recent or older.","Don''t analyze it.","Don''t compare it.","Just let it remind you that steadiness is possible."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What past moment shows you can handle challenges?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- What felt different then? - What helped you respond calmly? - What did you learn about yourself?"},{"type":"lesson","title":"Confidence Is Evidence-based","paragraphs":["Confidence doesn''t come from believing you''ll succeed.","It comes from knowing you''ve succeeded before.","Past wins don''t guarantee outcomes — they show capability."],"highlight":"Confidence doesn''t come from believing you''ll succeed."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/62.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You acknowledged past wins today.","secondaryMessage":"Experience builds assurance."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 63,
  'Living With Quiet Certainty (7-minute', 'Day 63 - Living With Quiet Certainty (7-minute', '', 8,
  '[{"type":"intro","dayNumber":63,"dayTitle":"Living With Quiet Certainty (7-minute","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, if a small urge or stress appears:","Pause briefly Let it pass Continue without opening the app If support is needed later, it''s still available."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you handle on your own today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- What helped you respond calmly? - How did it feel to trust yourself? - Did anything surprise you?"},{"type":"lesson","title":"Support Doesn''t Disappear","paragraphs":["Responding independently doesn''t mean support is gone.","It means support is no longer required for every moment.","That flexibility is confidence in action."],"highlight":"Responding independently doesn''t mean support is gone."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/63.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted yourself without opening the app today.","secondaryMessage":"Self-trust is forming."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 64,
  'Stability During Emotional', 'Day 64 - Stability During Emotional', '', 8,
  '[{"type":"intro","dayNumber":64,"dayTitle":"Stability During Emotional","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, enter a new or slightly unfamiliar situation without preparing excessively.","Let yourself respond naturally.","Trust that steadiness will show up when needed."]},{"type":"journal","prompt":"How did you respond in a new situation today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- What surprised you? - Did steadiness appear naturally? - Did anything feel easier than expected?"},{"type":"lesson","title":"You Don''t Reset in New Places","paragraphs":["New situations don''t erase progress.","You don''t start over each time something changes.","Confidence moves with you — quietly, reliably."],"highlight":"New situations don''t erase progress."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/64.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted yourself in something new today.","secondaryMessage":"Confidence travels."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 65,
  'Effortless Awareness in Motion (7-minute Guided Meditation) Find A', 'Day 65 - Effortless Awareness in Motion (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":65,"dayTitle":"Effortless Awareness in Motion (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you start planning how to handle something.","Instead of rehearsing, let the moment come.","Respond only if needed — not in advance."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What changed when you didn''t plan ahead today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did anxiety reduce? - Did responses come naturally? - Was the situation easier than expected?"},{"type":"lesson","title":"Planning Isn''t Protection","paragraphs":["Planning ahead isn''t what keeps you steady.","Your ability to pause, notice, and respond does that.","You already have what you need."],"highlight":"Planning ahead isn''t what keeps you steady."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/65.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed the day to unfold without rehearsal today.","secondaryMessage":"Steadiness meets the moment."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 66,
  'Living Without Urgency (7-minute Guided Meditation) Find A', 'Day 66 - Living Without Urgency (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":66,"dayTitle":"Living Without Urgency (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, if something unexpected happens:","Pause briefly Let the first reaction soften Respond only to what''s needed now You don''t need to regain control immediately."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did you respond to something unexpected today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did you pause before reacting? - Did calm return faster? - Did you trust yourself more?"},{"type":"lesson","title":"Confidence Adapts","paragraphs":["Confidence doesn''t require predictable conditions.","It adapts.","When surprises arise, your ability to respond calmly is already there."],"highlight":"Confidence doesn''t require predictable conditions."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/66.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You handled uncertainty without escalating today.","secondaryMessage":"Calm is adaptable."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 67,
  'CALM Consistency (7-minute Guided Meditation) Find A Comfortable Place to Sit.', 'Day 67 - CALM Consistency (7-minute Guided Meditation) Find A Comfortable Place to Sit.', '', 8,
  '[{"type":"intro","dayNumber":67,"dayTitle":"CALM Consistency (7-minute Guided Meditation) Find A Comfortable Place to Sit.","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, if a small slip happens:","Don''t judge it Don''t magnify it Don''t restart anything Continue calmly from where you are."]},{"type":"journal","prompt":"How did you respond after a small slip?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did you recover faster than before? - Did you avoid escalation? - Did you treat yourself with calm?"},{"type":"lesson","title":"Confidence Survives Imperfection","paragraphs":["Confidence doesn''t come from never slipping.","It comes from trusting your ability to recover.","Small slips don''t undo progress.","They prove it."],"highlight":"Confidence doesn''t come from never slipping."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/67.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted yourself even after imperfection today.","secondaryMessage":"Recovery continues."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 68,
  'Stability Without Effortful', 'Day 68 - Stability Without Effortful', '', 8,
  '[{"type":"intro","dayNumber":68,"dayTitle":"Stability Without Effortful","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice moments when you check how you''re doing.","Instead of answering the question, let it drop.","Return attention to what you''re doing."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What changed when you stopped checking in on yourself?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did attention feel freer? - Did calm last longer? - Did anything important get missed?"},{"type":"lesson","title":"Stability Doesn''t Need Observation","paragraphs":["You don''t need to watch stability for it to continue.","What''s integrated carries itself.","Attention belongs back in your life."],"highlight":"You don''t need to watch stability for it to continue."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/68.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived with less self-checking today.","secondaryMessage":"Trust feels lighter."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 69,
  'Living With Quiet Strength (7-minute', 'Day 69 - Living With Quiet Strength (7-minute', '', 8,
  '[{"type":"intro","dayNumber":69,"dayTitle":"Living With Quiet Strength (7-minute","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow long gaps without checking your progress.","If hours pass without thinking about habits, let them pass.","Trust what doesn''t require attention."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"How did it feel to let time pass without checking in?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Was there relief? - Was there discomfort? - Did anything actually require attention?"},{"type":"lesson","title":"Time Doesn''t Weaken Stability","paragraphs":["Stability doesn''t fade when it''s not watched.","What''s integrated becomes part of how you live.","Long gaps are proof of trust."],"highlight":"Stability doesn''t fade when it''s not watched."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/69.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted long gaps without attention today.","secondaryMessage":"Freedom expands with time."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 70,
  'Stability', 'Day 70 - Stability', '', 8,
  '[{"type":"intro","dayNumber":70,"dayTitle":"Stability","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t practice anything.","Just live.","If challenges arise, respond naturally.","If nothing arises, that''s okay too."]},{"type":"journal","prompt":"What feels quietly different now?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- What takes less effort? - What feels less important? - What feels more natural?"},{"type":"lesson","title":"From Here On","paragraphs":["From here, life continues without a daily program.","Support remains available — but it no longer needs to be central.","You don''t need to \"maintain\" confidence.","What''s integrated carries itself forward."],"highlight":"From here, life continues without a daily program."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/70.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Quiet confidence doesn''t need a finish line.","secondaryMessage":"Confidence continues quietly."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 71,
  'Long-term Identity', 'Day 71 - Long-term Identity', '', 8,
  '[{"type":"intro","dayNumber":71,"dayTitle":"Long-term Identity","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, live your day without checking for guidance.","No lesson.","No reflection required.","If support is needed, it''s available.","If not, that''s okay."]},{"type":"journal","prompt":"What was it like to move through today without a program?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did anything feel missing? - Did anything feel freeing? - Did life simply continue?"},{"type":"lesson","title":"Guidance Becomes Optional","paragraphs":["Programs help build patterns.","Life uses them.","You don''t need to replace one structure with another.","You''re allowed to live without scaffolding."],"highlight":"Programs help build patterns."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/71.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived without guidance today.","secondaryMessage":"Freedom is quiet."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 72,
  'Independence From Old', 'Day 72 - Independence From Old', '', 8,
  '[{"type":"intro","dayNumber":72,"dayTitle":"Independence From Old","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t structure your day around improvement.","Let life decide:","What comes next What matters What can wait Follow one moment at a time."]},{"type":"journal","prompt":"What happened when you let life lead today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did anything feel easier? - Did you stop over-directing? - Did life feel simpler?"},{"type":"lesson","title":"You Don''t Need Replacement Structure","paragraphs":["You don''t need another program to replace this one.","The goal was never more structure.","The goal was freedom to live without it."],"highlight":"You don''t need another program to replace this one."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/72.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You let life lead today.","secondaryMessage":"Life knows the way."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 73,
  'Stability Without Fear (7-minute Guided Meditation) Find A Comfortable Place', 'Day 73 - Stability Without Fear (7-minute Guided Meditation) Find A Comfortable Place', '', 8,
  '[{"type":"intro","dayNumber":73,"dayTitle":"Stability Without Fear (7-minute Guided Meditation) Find A Comfortable Place","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow the day to be uneventful.","Don''t search for progress.","Don''t create meaning.","Let normal life be enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice about an ordinary moment today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did anything feel calmer? - Did you stop checking for change? - Did the day pass easily?"},{"type":"lesson","title":"You Don''t Need Momentum","paragraphs":["Change doesn''t require momentum once it''s integrated.","Ordinary days are not a loss of progress.","They are proof that effort is no longer needed."],"highlight":"Change doesn''t require momentum once it''s integrated."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/73.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted an ordinary day today.","secondaryMessage":"Ordinary is stable."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 74,
  'Self-trust Without', 'Day 74 - Self-trust Without', '', 8,
  '[{"type":"intro","dayNumber":74,"dayTitle":"Self-trust Without","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow motivation to be whatever it is.","If energy is low, don''t compensate.","If motivation is high, don''t cling to it.","Let behavior remain simple and steady."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What changed when you stopped judging your motivation today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did pressure reduce? - Did steadiness continue anyway? - Did motivation matter less?"},{"type":"lesson","title":"Motivation Is Optional","paragraphs":["Motivation is not a requirement for living well.","When life is stable, action continues even when motivation dips.","That''s not weakness.","That''s integration."],"highlight":"Motivation is not a requirement for living well."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/74.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed motivation to fluctuate today.","secondaryMessage":"Stability is independent."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 75,
  'Living With CALM Independence', 'Day 75 - Living With CALM Independence', '', 8,
  '[{"type":"intro","dayNumber":75,"dayTitle":"Living With CALM Independence","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, let your energy level set the pace.","Don''t speed it up.","Don''t judge it.","Respond gently to what the day allows."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What changed when you stopped resisting low energy today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did pressure reduce? - Did urges lose intensity? - Did rest feel safer?"},{"type":"lesson","title":"Energy Doesn''t Define Readiness","paragraphs":["You don''t need high energy to live steadily.","Low-energy days don''t undo progress.","They''re part of a sustainable life."],"highlight":"You don''t need high energy to live steadily."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/75.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted a low-energy day today.","secondaryMessage":"Rest is stability."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 76,
  'Stability Without Overthinking', 'Day 76 - Stability Without Overthinking', '', 8,
  '[{"type":"intro","dayNumber":76,"dayTitle":"Stability Without Overthinking","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow the day to be uneventful.","Don''t add stimulation.","Don''t search for feeling.","Let calm be enough."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice when you stopped expecting something to happen?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did calm deepen? - Did restlessness pass? - Did life feel safer?"},{"type":"lesson","title":"Uneventful Is Healthy","paragraphs":["Many people confuse peace with boredom.","In reality, uneventful days mean the system no longer needs relief.","That''s not loss.","That''s freedom."],"highlight":"Many people confuse peace with boredom."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/76.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed life to be uneventful today.","secondaryMessage":"Calm is complete."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 77,
  'Living With', 'Day 77 - Living With', '', 8,
  '[{"type":"intro","dayNumber":77,"dayTitle":"Living With","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow the week to remain quiet.","Don''t add reflection.","Don''t search for growth.","Let time move forward without supervision."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice when you trusted a quiet stretch of time?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did anxiety decrease? - Did life feel fuller? - Did time feel safer?"},{"type":"lesson","title":"Time Doesn''t Need Management","paragraphs":["Stability doesn''t require daily attention.","When weeks pass quietly, nothing is being lost.","Something is being gained: freedom from monitoring."],"highlight":"Stability doesn''t require daily attention."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/77.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted quiet weeks today.","secondaryMessage":"Time is safe."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 78,
  'Effortless CALM Under Pressure (7-minute Guided', 'Day 78 - Effortless CALM Under Pressure (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":78,"dayTitle":"Effortless CALM Under Pressure (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice moments where you explain yourself internally.","When that happens, let the explanation go.","Return to what you''re doing — no story required."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What changed when you stopped telling a story about yourself today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did things feel lighter? - Did action replace explanation? - Did attention move outward?"},{"type":"lesson","title":"Identity Settles On Its Own","paragraphs":["You don''t need to define who you are now.","Identity settles naturally when attention returns to life.","Stories fade.","Living remains."],"highlight":"You don''t need to define who you are now."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/78.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived without narration today.","secondaryMessage":"Life speaks through living."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 79,
  'Living Without', 'Day 79 - Living Without', '', 8,
  '[{"type":"intro","dayNumber":79,"dayTitle":"Living Without","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you label yourself.","When that happens, let the label drop.","Continue with what you''re doing — no identity required."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What changed when you stopped labeling yourself today?","helperText":"One sentence is enough — or skip.","followUpPrompt":"- Did things feel lighter? - Did pressure reduce? - Did action feel more natural?"},{"type":"lesson","title":"Identity Doesn''t Need Defense","paragraphs":["You don''t need an identity to protect.","When labels fall away, life becomes simpler.","You''re free to respond as needed — without explanation."],"highlight":"You don''t need an identity to protect."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/79.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived without labels today.","secondaryMessage":"Living is enough."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 80,
  'Stability Without Doubt (7-minute Guided Meditation)', 'Day 80 - Stability Without Doubt (7-minute Guided Meditation)', '', 8,
  '[{"type":"intro","dayNumber":80,"dayTitle":"Stability Without Doubt (7-minute Guided Meditation)","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t define yourself.","Don''t decide who you are.","Don''t evaluate your journey.","Just live the day as it unfolds."]},{"type":"journal","prompt":"What did it feel like to live without defining yourself?","helperText":"Writing is optional. Silence is enough."},{"type":"lesson","title":"Nothing Needs to Replace This","paragraphs":["You don''t need another program.","You don''t need another framework.","You don''t need to \"continue the work.\"","What mattered has already integrated."],"highlight":"You don''t need another program."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/80.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"There is nothing to carry forward from this journey.","secondaryMessage":"Living doesn''t need explanation."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 81,
  'Living With Inner Clarity (7-minute', 'Day 81 - Living With Inner Clarity (7-minute', '', 8,
  '[{"type":"intro","dayNumber":81,"dayTitle":"Living With Inner Clarity (7-minute","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t reference the journey.","Don''t measure how far you''ve come.","Don''t ask what comes next.","Just live the day as it presents itself."]},{"type":"lesson","title":"If You Notice the App","paragraphs":["If you notice yourself opening the app out of habit, that''s okay.","You don''t need to do anything here.","You can close it and return to your day."],"highlight":"If you notice yourself opening the app out of habit, that''s okay."},{"type":"journal","prompt":"What did you notice about living with inner clarity (7-minute today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/81.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You''ve returned fully to life.","secondaryMessage":"Life is the practice."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 82,
  'Stability Through Simplicity (7-minute Guided', 'Day 82 - Stability Through Simplicity (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":82,"dayTitle":"Stability Through Simplicity (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you compare:","To the past To the journey To who you think you were When that happens, let the reference go.","Return to what''s happening now."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"If Comparison Appears","paragraphs":["Comparison may still arise.","You don''t need to stop it.","Just don''t follow it.","Attention belongs with what''s happening now."],"highlight":"Comparison may still arise."},{"type":"journal","prompt":"What did you notice about stability through simplicity (7-minute guided today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/82.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived without reference today.","secondaryMessage":"This moment is enough."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 83,
  'Living With Steady Confidence (7-minute Guided Meditation) Find A Comfortable', 'Day 83 - Living With Steady Confidence (7-minute Guided Meditation) Find A Comfortable', '', 8,
  '[{"type":"intro","dayNumber":83,"dayTitle":"Living With Steady Confidence (7-minute Guided Meditation) Find A Comfortable","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you think: \"How long has it been?\" When that happens, let the question go unanswered.","Return to what you''re doing.","Time doesn''t need attention."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"If Time Awareness Appears","paragraphs":["Awareness of time may still arise.","You don''t need to stop it.","Just don''t follow it.","Let time pass without commentary."],"highlight":"Awareness of time may still arise."},{"type":"journal","prompt":"What did you notice about living with steady confidence (7-minute guided meditation) find a comfortable today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/83.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You let time pass without noticing today.","secondaryMessage":"Time is free."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 84,
  'Stability Without External Validation (7-minute Guided', 'Day 84 - Stability Without External Validation (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":84,"dayTitle":"Stability Without External Validation (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you observe yourself:","Checking feelings Monitoring steadiness Watching reactions When that happens, gently return attention to the activity itself.","No observation needed."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"If Self-observation Appears","paragraphs":["Self-observation may still arise.","You don''t need to stop it.","Just don''t stay there.","Let attention return to what you''re doing."],"highlight":"Self-observation may still arise."},{"type":"journal","prompt":"What did you notice about stability without external validation (7-minute guided today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/84.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You lived without watching yourself today.","secondaryMessage":"Life lives itself."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 85,
  'Living With Complete', 'Day 85 - Living With Complete', '', 8,
  '[{"type":"intro","dayNumber":85,"dayTitle":"Living With Complete","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you want to check in on yourself.","When that happens, don''t answer the question.","Let life continue without confirmation."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"If the Urge to Check Appears","paragraphs":["The urge to check may still arise.","You don''t need to stop it.","Just don''t act on it.","Trust that life is already moving forward."],"highlight":"The urge to check may still arise."},{"type":"journal","prompt":"What did you notice about living with complete today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/85.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You trusted life without checking in today.","secondaryMessage":"Life continues on its own."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 86,
  'Living Without Internal Pressure', 'Day 86 - Living Without Internal Pressure', '', 8,
  '[{"type":"intro","dayNumber":86,"dayTitle":"Living Without Internal Pressure","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, allow yourself not to open the app.","If you do open it out of habit, that''s okay.","Nothing needs to be done here.","Close it gently and return to your day."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"If You Feel Resistance","paragraphs":["Feeling resistance to letting go doesn''t mean dependence.","It means something mattered.","You don''t need to force distance.","Let fading happen naturally."],"highlight":"Feeling resistance to letting go doesn''t mean dependence."},{"type":"journal","prompt":"What did you notice about living without internal pressure today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/86.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"You allowed the app to fade today.","secondaryMessage":"Support lives inside you."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 87,
  'Living With Complete Self-trust (7-minute Guided Meditation) Find A', 'Day 87 - Living With Complete Self-trust (7-minute Guided Meditation) Find A', '', 8,
  '[{"type":"intro","dayNumber":87,"dayTitle":"Living With Complete Self-trust (7-minute Guided Meditation) Find A","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"action_step","stepNumber":1,"title":"Today''s Practice","instructions":["Today, don''t seek support.","Don''t look for reassurance.","Don''t ask if you''re doing it right.","Let life respond to itself."]},{"type":"calm_trigger","context":"Trusting life without support does not remove support.\nYou can return if you need to.\nYou can ask for help.\nNothing has been closed.\nSupport is simply no longer required."},{"type":"journal","prompt":"What did you notice about living with complete self-trust (7-minute guided meditation) find a today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/87.mp3","durationSeconds":420},{"type":"action_step","stepNumber":2,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"There is nothing to continue from here.","secondaryMessage":"(very small):\nLiving doesn''t need support.\n(No CTA button — screen fades)\nBACKGROUND LOGIC (INVISIBLE)\n- App enters Dormant Mode\n- No future content scheduled\n- No notifications\n- App becomes:\no Optional reference only\no Silent unless opened intentionally\no Not part of daily life\nSAFETY & COMPLIANCE CHECK\nDay 87 avoids:\n\"You''ll never need help again\"\nAnti-support messaging\nTherapy or cure claims\nEmotional dependency\nDay 87 supports:\nPsychological safety\nAutonomy\nApp Store compliance\nEthical disengagement\nCORE MESSAGE OF DAY 87\nSupport was a bridge — not a destination.\nLife continues without holding on."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 88,
  'Living With Full Internal Freedom (7-minute Guided', 'Day 88 - Living With Full Internal Freedom (7-minute Guided', '', 8,
  '[{"type":"intro","dayNumber":88,"dayTitle":"Living With Full Internal Freedom (7-minute Guided","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, don''t plan a return.","Don''t imagine needing this again.","Don''t hold a safety copy.","Let life continue without a reference point."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"Nothing Is Closed","paragraphs":["Living without return doesn''t close doors.","Help is still available.","Support still exists.","This is not a rule.","It''s simply trust replacing preparation."],"highlight":"Living without return doesn''t close doors."},{"type":"journal","prompt":"What did you notice about living with full internal freedom (7-minute guided today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/88.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"There is nowhere you need to return to.","secondaryMessage":"No system to revisit."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 89,
  'Living With Complete Integration (7-minute Guided Meditation) Find', 'Day 89 - Living With Complete Integration (7-minute Guided Meditation) Find', '', 8,
  '[{"type":"intro","dayNumber":89,"dayTitle":"Living With Complete Integration (7-minute Guided Meditation) Find","goal":"Create a little more space between the urge and the next action.","estimatedMinutes":8},{"type":"mindfulness_exercise","title":"Today''s Practice","steps":["Today, notice when you ask: \"What does this mean?\" When that happens, let the question drop.","Return to what you''re doing.","Meaning is optional."],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"lesson","title":"Nothing Is Being Dismissed","paragraphs":["Letting go of meaning doesn''t erase experience.","It simply stops turning life into something to understand.","Understanding isn''t required for living well."],"highlight":"Letting go of meaning doesn''t erase experience."},{"type":"journal","prompt":"What did you notice about living with complete integration (7-minute guided meditation) find today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"audio","title":"Guided Meditation","description":"Create a little more space between the urge and the next action.","audioStoragePath":"audio/90-day/89.mp3","durationSeconds":420},{"type":"action_step","stepNumber":1,"title":"Gentle Practice","instructions":["Pause for one minute.","Notice your breath.","Let the moment be enough without trying to force a result."]},{"type":"close","message":"Nothing needs to be learned from this day.","secondaryMessage":"Nothing needs to be remembered."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, content_text, estimated_minutes, cards)
VALUES (
  'b6955e65-bc79-4e9d-94b6-7d927c299216', 'ninety_day_transform', 90,
  'Letting Life Be Enough', 'Day 90 - Letting Life Be Enough', '', 8,
  '[{"type":"intro","dayNumber":90,"dayTitle":"Letting Life Be Enough","goal":"End without instruction, identity, or takeaway","estimatedMinutes":8},{"type":"lesson","title":"Title","paragraphs":["Day 90 · Letting Life Be Enough"],"highlight":"Day 90 · Letting Life Be Enough"},{"type":"lesson","title":"Single Statement","paragraphs":["Nothing needs to be added.","Nothing needs to be removed.","Life, as it is, is enough."],"highlight":"Nothing needs to be added."},{"type":"mindfulness_exercise","title":"Brief Pause (optional Audio or Silence)","duration":"10–15 seconds","steps":["Instruction (small text):","Pause for a moment.","(10–15 seconds of silence, or no audio at all.)"],"completionMessage":"The aim is not to force change. The aim is to notice what happens with more space."},{"type":"journal","prompt":"What did you notice about letting life be enough today?","helperText":"Keep it brief if you want. The goal is noticing, not performing."},{"type":"lesson","title":"Final Line","paragraphs":["You can close this and continue your day.","(No CTA button. Screen fades.)","APP BEHAVIOR (INVISIBLE)","No next day","No reminders","No summaries","No prompts","App remains silent and optional","FINAL MESSAGE","Life doesn''t need support.","It doesn''t need meaning.","It doesn''t need continuation.","It''s already enough."],"highlight":"You can close this and continue your day."},{"type":"audio","title":"Guided Meditation","description":"End without instruction, identity, or takeaway","audioStoragePath":"audio/90-day/90.mp3","durationSeconds":420},{"type":"close","message":"That is enough for today.","secondaryMessage":"End without instruction, identity, or takeaway"}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

COMMIT;
