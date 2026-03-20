# Multi-Program Soft Cleanup Design

Date: 2026-03-20
Status: Approved
Branch: `rebuild/multi-program`

## Purpose

Reduce project confusion before rebuild work starts.

This document does not redesign the app itself. It defines the active workspace
boundaries so future rebuild sessions start from one clear source of truth.

## Source Of Truth

- Active codebase: `app/`
- Rebuild spec: `../../../MASTER_CONTEXT.md`
- Repo-local planning docs: `app/docs/plans/`

## Working Boundaries

Treat these paths as active:

- `app/`
- `MASTER_CONTEXT.md`
- `app/docs/plans/`

Treat these paths as reference-only unless a task explicitly needs them:

- `planning/`
- `planning_app/`
- `research/`
- `web/`
- `documents/`
- `supabase/` at the workspace root

## Rules

1. Do not delete or move old files during soft cleanup.
2. Do not rebuild screens during this setup session.
3. Keep old app code in place until the replacement is proven.
4. Put new planning decisions inside the repo so context is versioned with code.

## First Session Output

The first setup session is complete when these outputs exist:

1. Branch `rebuild/multi-program`
2. Folder `app/docs/plans/`
3. This design doc committed on the rebuild branch

## Next Step After Cleanup

Start the rebuild from the app repo, not the workspace root.

Immediate next implementation sequence:

1. Define the new content and program types
2. Add the card renderer foundation and temporary test route
3. Rework access, paywall, and onboarding after the new content engine is stable

## Notes

- `MASTER_CONTEXT.md` is currently outside the git repo, so it cannot be the
  first tracked file unless it is copied into `app/` later.
- The current repo is a two-program, single-owned-program app. The rebuild work
  should proceed on this branch only.
