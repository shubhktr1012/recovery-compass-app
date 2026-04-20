# Multi-Program Questionnaire — Implementation Spec

> Source: Marketing & App Details doc from Anjan
> Replaces: V1 `app/(auth)/personalization.tsx` (smoking-only)
> Current screen: `app/(auth)/personalization.tsx`

## Current Storage Contract

On completion (before paywall), save:
- `recommended_program`
- `questionnaire_answers` in `profiles`
- an append-only history row in `questionnaire_runs`
- `onboarding_completed_at`
- `onboarding_complete = true`

Do not persist:
- quiet-hours fields
- legacy entitlement mirrors

## Current Meaning

- `profiles.questionnaire_answers` holds the user’s live questionnaire snapshot
- `questionnaire_runs` stores completed questionnaire history for future analytics and support
- `recommended_program` stores the routed program slug
- `onboarding_complete` unlocks the app
- `onboarding_completed_at` records when onboarding finished

## What Still Matters

- `recommended_program` is still used by the app for routing and re-alignment
- the questionnaire should continue to set `onboarding_complete`
- the question flow can still derive a branch from the primary concern answer, but that answer should live inside `questionnaire_answers`

## What Is No Longer Stored Separately

- `quiet_hours_start`
- `quiet_hours_end`
- `preferred_push_hour`

## Notes For The Flow

- Keep the adaptive questionnaire logic
- Keep the multi-step onboarding experience
- Keep the paywall recommendation handoff
- Keep the routing that maps the concern answer to the correct program
