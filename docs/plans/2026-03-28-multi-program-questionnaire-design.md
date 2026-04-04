# Multi-Program Questionnaire Design

Date: 2026-03-28
Status: Approved
Branch: `rebuild/multi-program`

## Scope

Replace the legacy smoking-only personalization flow in
`app/(auth)/personalization.tsx` with one adaptive launch questionnaire.

## Launch Mapping

- Smoking or cravings concerns -> `six_day_reset`
- Fatigue, weight, brain fog, or hidden stress -> `age_reversal`
- Smoking branch result screen should surface both smoking offers:
  `six_day_reset` and `ninety_day_transform`
  The stored primary recommendation remains `six_day_reset`.

## Key Decisions

- Keep the existing `/personalization` route so auth guard wiring does not
  change in this slice.
- Do not mark `onboarding_complete` until the final recommendation CTA, so the
  user can see the recommendation screen before the route guard moves them to
  `/paywall`.
- Persist the new questionnaire profile fields as source of truth.
- Also write a minimal compatibility payload to `onboarding_responses` so the
  current Home/Profile screens still have name, target, and summary data while
  the later paywall/profile cleanup is pending.

## Verification

- New users complete the adaptive questionnaire inside `/personalization`
- Smoking selections recommend `six_day_reset`
- Smoking result screen presents both smoking program choices before paywall
- Fatigue/stress selections recommend `age_reversal`
- Final CTA saves questionnaire data, marks onboarding complete, and routes to
  `/paywall`
