# n8n Workflow: Canonical Program Seeding (Cloud Safe)

This version works on n8n Cloud because it does not use `Execute Command`.

It triggers a GitHub Actions workflow, then polls run status.

Workflow files:
- `docs/n8n-program-canonical-seed-workflow.json` (n8n import)
- `.github/workflows/canonical-seed.yml` (GitHub Actions runner)

## Why this changed

If you saw:

`Unrecognized node type: n8n-nodes-base.executeCommand`

your n8n environment does not support shell-exec nodes. This flow moves execution to GitHub Actions.

## Setup

1. Push `.github/workflows/canonical-seed.yml` to your GitHub repo default branch.
2. In n8n, set env var `GITHUB_TOKEN` with a PAT that has:
   - `repo` scope
   - `workflow` scope
3. Import `docs/n8n-program-canonical-seed-workflow.json`.
4. Open `Set Config` node and set:
   - `owner`: GitHub org/user
   - `repo`: repository name
   - `workflow_id`: `canonical-seed.yml`
   - `ref`: branch to run on (usually `main`)
   - `program_slug`: e.g. `six_day_reset`
   - `apply_to_db`: `false` for safe test first

## Optional DB apply

If you set `apply_to_db=true`, GitHub Actions will run `psql` against:

- GitHub Actions secret `SUPABASE_DB_URL`

Example:

```bash
postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

## First test (recommended)

1. Keep `apply_to_db=false`
2. Run workflow with `program_slug=six_day_reset`
3. Confirm final node is `Result Success`
4. Open `run_url` in output and confirm artifacts exist:
   - `content/canonical/six_day_reset.json`
   - `supabase/seeds/six_day_reset_program_days.sql`

## Validation strategy before all-program automation

Current canonical normalizer coverage is `six_day_reset` only.

Before enabling more slugs in n8n:
1. Add normalizer support in `scripts/normalize-program-content.mjs`
2. Run and validate for that slug
3. Only then expose slug in automation

This keeps output quality controlled program-by-program.
