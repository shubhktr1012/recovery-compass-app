# Onboarding Questionnaire Redesign

Date: 2026-03-29
Status: Approved
Branch: `rebuild/multi-program`

## Scope

Redesign onboarding in `app/(auth)/personalization.tsx` so the flow feels
clear, intentional, and predictable for two user types:

- users who already know which program they want
- users who want the app to guide them to the right program

This redesign replaces the current vague recommendation-first arc with an
explicit routing structure that collects baseline context without making the
questionnaire feel like paperwork or manipulation.

## Goals

- make it obvious where the questionnaire is taking the user
- explain why personal information is being collected
- support both self-selection and guided recommendation
- keep recommendation logic deterministic
- collect baseline context needed for stats, personalization, and mentor /
  guide / counselor context

## Non-Goals

- do not rename live program durations yet
- do not switch app/paywall/catalog names to new duration-based labels until
  updated content arrives from Anjan
- do not let later questionnaire answers override the initial guided branch

## Entry Flow

### Screen 1: Quick Profile

The first screen is a short profile setup with a clear explanation that these
details help personalize the plan and support context.

Fields:

- `name`
- `age`
- `gender`

CTA:

- `Continue`

### Screen 2: Path Choice

The fork happens immediately after the quick profile screen.

Choices:

- `I already know what I want`
- `Help me choose`

This keeps the purpose of onboarding explicit from the start.

## Path A: I Already Know

This path is shorter and should feel like program-specific setup, not a
diagnostic quiz.

### Program Selection

The selection screen is a plain scrollable list in this order:

- `Quit Smoking`
- `Sleep Disorder Reset`
- `Energy & Vitality`
- `Age Reversal`
- `Male Sexual Health`

Rules:

- `Male Sexual Health` is hidden if `gender` is not `Male`
- smoking appears as one broad choice on this screen
- the smoking product split happens later on the paywall

### Question Sequence

After program selection, ask:

1. program-specific friction question
2. program-specific duration / history question
3. program-specific trigger / lifestyle question
4. program-specific severity / baseline question
5. program-specific coping method / current reliance question
6. `What else is affecting you?` multi-select

### Handoff

- no recommendation screen on this path
- go directly to the paywall after the adaptive baseline
- if the user chose smoking, the paywall shows both smoking offers
- if the user chose any other program, the paywall shows only that program

## Path B: Help Me Choose

This path is deeper and should feel like guided narrowing, not hidden routing.

### Main Routing Question

The first guided question is:

- `What’s your main issue right now?`

This is a single-select question. It locks the branch immediately.

### Approved Symptom Mapping

- `Cravings / smoking urges` -> smoking branch
- `Poor sleep` -> `sleep_disorder_reset`
- `Low energy` -> `energy_vitality`
- `Brain fog` -> `age_reversal`
- `Stress overload` -> `age_reversal`
- `Weight gain / slowed metabolism` -> `age_reversal`
- `Low libido / poor performance` -> `male_sexual_health`

### Question Sequence

After the main issue question, ask:

1. how long this has been going on
2. what affects them most day to day
3. one severity / baseline question
4. `What else is affecting you?` multi-select
5. deeper branch-specific question 1
6. deeper branch-specific question 2

### Recommendation Rules

- the first main-issue answer locks the branch
- later answers personalize the experience but do not change the program
- recommendation screen stays on this path because it resolves uncertainty

### Recommendation Screen

The recommendation screen must answer:

- what program is being recommended
- why it fits the user’s main issue
- what the program is designed to improve

Then route to the paywall.

Smoking rule:

- smoking recommendation still leads to a paywall that shows both smoking
  offers

## Shared UX Rules

- one clear question per screen
- always show visible progress
- progress should reflect the chosen path, not a fake global step count
- selected states must be visually obvious immediately
- single-select only for routing questions
- multi-select only for `What else is affecting you?`
- do not use vague recommendation language too early
- do not use “we’re analyzing you” language until the guided path is near the
  result
- CTA copy should stay predictable:
  - `Continue`
  - `See your recommendation`
  - `See plans`

## Data To Persist

Persist at minimum:

- quick profile:
  - `name`
  - `age`
  - `gender`
- onboarding path:
  - `self_select`
  - `guided_recommendation`
- selected program or main issue
- secondary symptoms from `What else is affecting you?`
- full questionnaire answers
- final `recommended_program`

## Current Naming Constraint

Duration-based names are in flux.

Confirmed future naming direction:

- sleep: `21-Day Sleep Disorder Reset`
- energy: `14-Day Energy & Vitality`
- male sexual health: `30-Day Male Sexual Health`

But the live app, paywall, catalog, and content should not switch to those
names until the matching updated content arrives. The questionnaire redesign
can proceed now with stable non-duration-first labels, and the full naming /
content swap should happen in a later synchronized content pass.
