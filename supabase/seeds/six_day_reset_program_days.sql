-- six_day_reset seed (generated from canonical content)
-- Source: documents/Sent By Anjan/program_content/6 days program text on screen.md
-- Generated at: 2026-04-03T14:45:22.026Z

BEGIN;

DELETE FROM public.program_days
WHERE program_slug = 'six_day_reset'
  AND day_number NOT IN (1, 2, 3, 4, 5, 6);

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'six_day_reset' LIMIT 1),
  'six_day_reset',
  1,
  'Decision & Reset',
  'Day 1 - Decision & Reset',
  10,
  '[{"type":"intro","dayNumber":1,"dayTitle":"Decision & Reset","goal":"Break autopilot and take control for today.","estimatedMinutes":10},{"type":"lesson","title":"Today''s Focus","paragraphs":["Break autopilot and take control for today."],"highlight":"Break autopilot and take control for today."},{"type":"action_step","stepNumber":1,"title":"Decide For Today Only","instructions":["Say: “Today, I choose not to smoke / drink.”","No lifetime promise. Just today."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":2,"title":"Remove Easy Access","instructions":["Throw away cigarettes / alcohol.","Clear lighters, bottles, ashtrays.","Make it harder to act automatically."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":3,"title":"Change Your Space","instructions":["Clean or rearrange something.","Signal a fresh start to your brain."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":4,"title":"Take Care Of Your Body","instructions":["Drink more water.","Eat properly.","Rest when needed."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"mindfulness_exercise","title":"When An Urge Comes","steps":["Pause.","Take slow breaths.","Wait 10 minutes.","Remind yourself: “This will pass.”"],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"action_step","stepNumber":5,"title":"Avoid High-risk Situations","instructions":["Stay away from strong triggers today. (friends/ favourite tea/coffee spot/your terrace)"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What from Day 1 felt most useful today?","helperText":"A short reflection is enough.","followUpPrompt":"What response would you repeat tomorrow?"},{"type":"close","message":"You made a choice.","secondaryMessage":"You interrupted autopilot."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'six_day_reset' LIMIT 1),
  'six_day_reset',
  2,
  'Understanding Urges',
  'Day 2 - Understanding Urges',
  10,
  '[{"type":"intro","dayNumber":2,"dayTitle":"Understanding Urges","goal":"Learn that urges are temporary, not commands.","estimatedMinutes":10},{"type":"lesson","title":"Today''s Focus","paragraphs":["Learn that urges are temporary, not commands."],"highlight":"Learn that urges are temporary, not commands."},{"type":"action_step","stepNumber":1,"title":"Notice The First Hint","instructions":["As soon as you feel like smoking or drinking, pause.","Catch it early."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"mindfulness_exercise","title":"Observe, Don’t React","steps":["Pay attention to the sensation.","Where do you feel it — chest, hands, throat, mind?","Just observe."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"mindfulness_exercise","title":"Breathe Slowly","steps":["Take slow, steady breaths.","Longer exhale than inhale.","Let your body calm first."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"mindfulness_exercise","title":"Wait 10 Minutes","steps":["Do nothing.","Let the urge rise and fall on its own.","Most urges fade if you don’t act."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"mindfulness_exercise","title":"Notice The Thoughts","steps":["If your mind says, “Just one,”","recognize it as the habit voice.","You don’t need to argue — just notice."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"action_step","stepNumber":2,"title":"Track Your Triggers","instructions":["Ask yourself:","When did it happen?","What was I feeling?","You are gathering awareness, not judging."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What from Day 2 felt most useful today?","helperText":"A short reflection is enough.","followUpPrompt":"What response would you repeat tomorrow?"},{"type":"close","message":"Urges are waves.","secondaryMessage":"They peak."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'six_day_reset' LIMIT 1),
  'six_day_reset',
  3,
  'Handling Withdrawal & Emotions',
  'Day 3 - Handling Withdrawal & Emotions',
  11,
  '[{"type":"intro","dayNumber":3,"dayTitle":"Handling Withdrawal & Emotions","goal":"Stay steady while your body and emotions adjust.","estimatedMinutes":11},{"type":"lesson","title":"Today''s Focus","paragraphs":["Stay steady while your body and emotions adjust."],"highlight":"Stay steady while your body and emotions adjust."},{"type":"action_step","stepNumber":1,"title":"Support Your Body","instructions":["Drink more water.","Eat regular meals.","Rest when possible.","Your body is recalibrating."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":2,"title":"Expect Mood Changes","instructions":["You may feel irritated, tired, anxious, or low.","This is temporary adjustment — not failure."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"mindfulness_exercise","title":"Calm Before Reacting","steps":["If emotions rise, slow your breathing.","Long exhale.","Let your nervous system settle first."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"mindfulness_exercise","title":"Allow Feelings To Pass","steps":["Don’t suppress emotions.","Notice them in your body.","They move if you don’t fight them."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"action_step","stepNumber":3,"title":"Reduce Extra Stress","instructions":["Keep today lighter.","Avoid arguments or high-pressure situations if possible."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"exercise_routine","title":"Move Gently","exercises":[{"name":"Take A Short Walk.","instructions":["Perform with steady breathing and controlled pacing."]},{"name":"Stretch.","instructions":["Perform with steady breathing and controlled pacing."]},{"name":"Release Physical Tension.","instructions":["Perform with steady breathing and controlled pacing."]}]},{"type":"action_step","stepNumber":4,"title":"Remind Yourself","instructions":["Discomfort = healing.","Withdrawal is temporary.","You are stabilizing.","Day 3 is about staying calm while your system resets."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What from Day 3 felt most useful today?","helperText":"A short reflection is enough.","followUpPrompt":"What response would you repeat tomorrow?"},{"type":"close","message":"Day 3 is complete.","secondaryMessage":"Stay steady while your body and emotions adjust."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'six_day_reset' LIMIT 1),
  'six_day_reset',
  4,
  'Break the Routine',
  'Day 4 - Break the Routine',
  11,
  '[{"type":"intro","dayNumber":4,"dayTitle":"Break the Routine","goal":"Interrupt old patterns and build new responses.","estimatedMinutes":11},{"type":"lesson","title":"Today''s Focus","paragraphs":["Interrupt old patterns and build new responses."],"highlight":"Interrupt old patterns and build new responses."},{"type":"action_step","stepNumber":1,"title":"Notice Old Habit Times","instructions":["When did you usually smoke or drink?","After meals? Evening? Stress?","Be aware of those moments."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":2,"title":"Change The Pattern","instructions":["Do something different at that time.","Stay seated. Walk. Drink water. Stretch.","Break the automatic link."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":3,"title":"Change Your Environment","instructions":["Sit in a different place.","Take a new route.","Shift your surroundings slightly."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":4,"title":"Replace, Don’t Remove","instructions":["When the old urge time comes,","insert a small healthy action instead."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":5,"title":"Strengthen Identity","instructions":["Tell yourself:","“I’m becoming someone who doesn’t rely on this.”"],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":6,"title":"Notice Improvement","instructions":["Are urges shorter? Weaker?","Even small changes matter."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":7,"title":"Stay Steady","instructions":["Don’t test yourself unnecessarily.","You’re building stability, not proving willpower.","Day 4 is about choosing differently instead of reacting automatically."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What from Day 4 felt most useful today?","helperText":"A short reflection is enough.","followUpPrompt":"What response would you repeat tomorrow?"},{"type":"close","message":"Day 4 is complete.","secondaryMessage":"Interrupt old patterns and build new responses."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'six_day_reset' LIMIT 1),
  'six_day_reset',
  5,
  'Confidence & Slip Protection',
  'Day 5 - Confidence & Slip Protection',
  12,
  '[{"type":"intro","dayNumber":5,"dayTitle":"Confidence & Slip Protection","goal":"Strengthen confidence and prepare for real-life triggers.","estimatedMinutes":12},{"type":"lesson","title":"Today''s Focus","paragraphs":["Strengthen confidence and prepare for real-life triggers."],"highlight":"Strengthen confidence and prepare for real-life triggers."},{"type":"action_step","stepNumber":1,"title":"Notice Your Progress","instructions":["You’ve gone several days without giving in.","That proves you can handle urges."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":2,"title":"Stay Consistent","instructions":["When an urge appears,","pause, breathe, wait — just like before."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":3,"title":"Prepare For Triggers","instructions":["Imagine someone offering you a cigarette or drink.","Mentally rehearse saying no calmly."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":4,"title":"Don’t Test Yourself","instructions":["Avoid high-risk situations today.","Stability is more important than proving willpower."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":5,"title":"Watch For Overconfidence","instructions":["Thoughts like “One won’t hurt” may appear.","Recognize them as habit thoughts."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":6,"title":"If A Slip Ever Happens","instructions":["Don’t panic.","Return to awareness immediately.","Continue — don’t quit the programme.","Day 5 is about steady confidence, not pressure."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What from Day 5 felt most useful today?","helperText":"A short reflection is enough.","followUpPrompt":"What response would you repeat tomorrow?"},{"type":"close","message":"Day 5 is complete.","secondaryMessage":"Strengthen confidence and prepare for real-life triggers."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

INSERT INTO public.program_days (program_id, program_slug, day_number, day_title, title, estimated_minutes, cards)
VALUES (
  (SELECT id FROM public.programs WHERE slug = 'six_day_reset' LIMIT 1),
  'six_day_reset',
  6,
  'Stability & Moving Forward',
  'Day 6 - Stability & Moving Forward',
  12,
  '[{"type":"intro","dayNumber":6,"dayTitle":"Stability & Moving Forward","goal":"Shift from quitting to living normally without the habit.","estimatedMinutes":12},{"type":"lesson","title":"Today''s Focus","paragraphs":["Shift from quitting to living normally without the habit."],"highlight":"Shift from quitting to living normally without the habit."},{"type":"action_step","stepNumber":1,"title":"Acknowledge Your Progress","instructions":["You’ve completed six days.","That proves you can interrupt the pattern."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"mindfulness_exercise","title":"Treat Urges As Background Noise","steps":["If a thought appears,","pause briefly and move on.","Don’t give it importance."],"completionMessage":"Stay with the practice until your body and mind feel steadier."},{"type":"action_step","stepNumber":2,"title":"Live Normally Today","instructions":["Focus on work, meals, conversations, rest.","Let quitting move into the background."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":3,"title":"Avoid Testing Yourself","instructions":["No need to “prove” anything.","Stability grows quietly."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":4,"title":"Prepare For The Future","instructions":["Occasional thoughts may appear later.","That’s normal. Your response has changed."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"action_step","stepNumber":5,"title":"Commit To Ongoing Awareness","instructions":["Continue using pause, breathing, and calm response.","Consistency builds long-term strength.","Day 6 is about steady confidence and long-term mindset."],"whyThisWorks":"Small consistent actions reinforce stability and reduce automatic, stress-driven reactions."},{"type":"journal","prompt":"What from Day 6 felt most useful today?","helperText":"A short reflection is enough.","followUpPrompt":"What response would you repeat tomorrow?"},{"type":"close","message":"Day 6 is complete.","secondaryMessage":"Shift from quitting to living normally without the habit."}]'::jsonb
)
ON CONFLICT (program_slug, day_number) DO UPDATE SET
  cards = EXCLUDED.cards,
  day_title = EXCLUDED.day_title,
  estimated_minutes = EXCLUDED.estimated_minutes,
  updated_at = NOW();

COMMIT;
