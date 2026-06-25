-- ============================================================
-- Recovery Compass — Phase 1, Day 3
-- Annotate existing program_days.cards JSONB with time-slot
-- metadata: timeSlot, isTimeSensitive, hasEffortCheck
--
-- Covers: six_day_reset (6 days), ninety_day_transform (90 days)
-- Total rows affected: 96
-- Safe to re-run: only updates rows that still contain unannotated cards
--
-- Annotation rules (spec §2.2, §4.1):
--
--   intro              → anytime,   not time-sensitive
--   lesson             → anytime,   not time-sensitive
--   audio              → evening,   not time-sensitive  (meditation/guidance)
--   journal            → evening,   not time-sensitive
--   close              → evening,   not time-sensitive
--   mindfulness_exercise → anytime, not time-sensitive
--   calm_trigger       → anytime,   not time-sensitive
--   breathing_exercise → anytime,   not time-sensitive
--   action_step (1st)  → morning,   not time-sensitive  (primary daily practice)
--   action_step (2nd+) → anytime,   not time-sensitive  (supporting steps)
--   exercise_routine   → morning,   not time-sensitive, hasEffortCheck = true
--
-- The first action_step is the morning anchor, but it remains catch-up
-- friendly because the existing smoking and 90-day practices are still useful
-- if the user first opens the app later in the day.
-- ============================================================

UPDATE public.program_days
SET cards = annotated.new_cards
FROM (
  SELECT
    pd.id,
    jsonb_agg(annotated_card ORDER BY card_index) AS new_cards
  FROM public.program_days pd,
  LATERAL (
    SELECT
      annotated.card_index,
      annotated.annotated_card
    FROM (
      SELECT
        ordinality - 1 AS card_index,
        CASE
        -- Skip if already annotated (idempotent)
        WHEN card ? 'timeSlot' THEN card

        -- intro: orientation, available all day
        WHEN card->>'type' = 'intro' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'anytime',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- lesson: educational, available all day
        WHEN card->>'type' = 'lesson' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'anytime',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- audio: evening meditation/guidance, catch-up friendly
        WHEN card->>'type' = 'audio' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'evening',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- journal: evening reflection, catch-up friendly
        WHEN card->>'type' = 'journal' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'evening',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- close: end-of-day summary, evening
        WHEN card->>'type' = 'close' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'evening',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- mindfulness_exercise: flexible, available all day
        WHEN card->>'type' = 'mindfulness_exercise' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'anytime',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- breathing_exercise: flexible, available all day
        WHEN card->>'type' = 'breathing_exercise' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'anytime',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- calm_trigger: on-demand, available all day
        WHEN card->>'type' = 'calm_trigger' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'anytime',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )

        -- exercise_routine: morning physical practice, effort check enabled
        WHEN card->>'type' = 'exercise_routine' THEN
          card
          || jsonb_build_object(
               'timeSlot',        'morning',
               'isTimeSensitive', false,
               'hasEffortCheck',  true
             )

        -- action_step: first one is the core morning task,
        -- all subsequent ones are supporting steps (anytime, catch-up friendly)
        WHEN card->>'type' = 'action_step' THEN
          card
          || CASE WHEN (
               SELECT COUNT(*)
               FROM jsonb_array_elements(pd.cards) WITH ORDINALITY AS inner_cards(inner_card, inner_ord)
               WHERE inner_ord < ordinality
                 AND inner_card->>'type' = 'action_step'
             ) = 0 THEN
               jsonb_build_object(
                 'timeSlot',        'morning',
                 'isTimeSensitive', false,
                 'hasEffortCheck',  false
               )
             ELSE
               jsonb_build_object(
                 'timeSlot',        'anytime',
                 'isTimeSensitive', false,
                 'hasEffortCheck',  false
               )
             END

        -- Fallback for any card types added in future: safe anytime default
        ELSE
          card
          || jsonb_build_object(
               'timeSlot',        'anytime',
               'isTimeSensitive', false,
               'hasEffortCheck',  false
             )
        END AS annotated_card
      FROM jsonb_array_elements(pd.cards) WITH ORDINALITY AS cards_with_ord(card, ordinality)
    ) AS annotated
  ) AS annotated
  WHERE pd.program_slug IN ('six_day_reset', 'ninety_day_transform')
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(pd.cards) AS existing_card(card)
      WHERE NOT (
        existing_card.card ? 'timeSlot'
        AND existing_card.card ? 'isTimeSensitive'
        AND existing_card.card ? 'hasEffortCheck'
      )
    )
  GROUP BY pd.id
) AS annotated
WHERE program_days.id = annotated.id
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(program_days.cards) AS existing_card(card)
    WHERE NOT (
      existing_card.card ? 'timeSlot'
      AND existing_card.card ? 'isTimeSensitive'
      AND existing_card.card ? 'hasEffortCheck'
    )
  );


-- ============================================================
-- VERIFICATION
-- Run after applying to confirm all cards are annotated.
-- ============================================================

-- 1. Confirm zero unannotated cards remain
-- SELECT program_slug, COUNT(*) AS unannotated_cards
-- FROM program_days,
--   LATERAL jsonb_array_elements(cards) AS card
-- WHERE program_slug IN ('six_day_reset', 'ninety_day_transform')
--   AND NOT (card ? 'timeSlot')
-- GROUP BY program_slug;
-- Expected: 0 rows

-- 2. Spot-check annotation distribution for ninety_day_transform day 1
-- SELECT card->>'type' AS type, card->>'timeSlot' AS slot,
--        card->>'isTimeSensitive' AS sensitive
-- FROM program_days,
--   LATERAL jsonb_array_elements(cards) AS card
-- WHERE program_slug = 'ninety_day_transform' AND day_number = 1;
-- Expected:
--   intro         → anytime,  false
--   lesson        → anytime,  false
--   audio         → evening,  false
--   action_step   → morning,  false  (first one)
--   journal       → evening,  false
--   close         → evening,  false

-- 3. Spot-check six_day_reset day 1 (17 cards, multiple action_steps)
-- SELECT card->>'type', card->>'timeSlot', card->>'isTimeSensitive',
--        card->>'hasEffortCheck'
-- FROM program_days,
--   LATERAL jsonb_array_elements(cards) WITH ORDINALITY AS card(card, ordinality)
-- WHERE program_slug = 'six_day_reset' AND day_number = 1
-- ORDER BY ordinality;
-- Expected: only the first action_step has timeSlot=morning
