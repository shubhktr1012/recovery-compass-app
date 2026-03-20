# Multi-Program Content Foundation Design

Date: 2026-03-20
Status: Approved
Branch: `rebuild/multi-program`

## Purpose

Build the V2 content foundation for the multi-program rebuild without breaking
the current app.

This phase establishes the new content types, repository, sample content, and
an isolated validation route. It does not replace the live program flow yet.

## Source Context

- Rebuild spec: `../../../MASTER_CONTEXT.md`
- Cleanup boundary doc:
  `docs/plans/2026-03-20-multi-program-soft-cleanup-design.md`

## Decision

Use the new engine for all 6 program slugs now, but wire real card-based
content only for the 2 smoking programs first.

This separates architecture risk from content migration risk.

## Architecture

Add a parallel V2 content layer alongside the existing app code:

- `types/content.ts`
- `content/programs/`
- `content/index.ts`
- `components/cards/`
- `app/test-cards.tsx`

Do not replace the current V1 program types or repository during this phase.

## Scope

In scope:

- define all 6 `ProgramSlug` values in the new V2 content layer
- define the `ContentCard` union and related day/program types
- create metadata for all 6 programs
- add real sample card-based day content for `six_day_reset`
- add real sample card-based day content for `ninety_day_transform`
- add a temporary isolated route to preview the new content engine

Out of scope:

- replacing the current Program tab
- replacing the current paywall
- replacing the current personalization flow
- changing Supabase schema
- changing RevenueCat access logic
- deleting `lib/programs/*`

## Validation

The proof for this phase is a temporary route that loads sample V2 day content
without touching the production program flow.

Validation goals:

1. local typed content can be loaded from the new repository
2. card-based day content can be rendered in isolation
3. the data shape is stable enough for later pager-based day detail work

## Implementation Sequence

1. Add V2 content and program types
2. Add V2 repository and program metadata
3. Add sample smoking-program day content
4. Add a minimal card renderer foundation
5. Add the temporary `test-cards` route
6. Verify with typecheck before moving on

## Guardrails

1. Keep old and new systems running in parallel
2. Make no access, paywall, or onboarding changes in this phase
3. Prefer the smallest proof that validates the architecture
4. Commit this design before starting code changes
