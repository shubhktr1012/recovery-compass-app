# Template Program SQL Workflow

Use this for every new template-mode program seed.

## 1. Generate the draft SQL

Save the program SQL into `app/docs/new-program-sqls/<program>-new-sql.sql`.

Requirements:
- SQL only
- one `INSERT ... ON CONFLICT DO UPDATE` for `public.program_templates`
- one `INSERT ... ON CONFLICT DO UPDATE` for `public.program_progressions`
- resolver placeholders must use `{variable}`, never `{{variable}}`

## 2. Run the structural validator

From `app/`:

```bash
npm run template-sql:validate -- \
  --file ./docs/new-program-sqls/<program>-new-sql.sql \
  --canonical ./content/canonical/<program>.json
```

This catches the recurring failures:
- transcript/debug junk mixed into SQL
- wrong template slot schema
- bad placeholder syntax
- non-idempotent inserts
- bad `replace_slots` shape
- unsupported card types / time slots
- invented day titles that drift from canonical content

Reflection rule:
- when the redesign spec says `reflection`, use runtime `journal` unless the app later gets a dedicated reflection card type

## 3. Review spec alignment

After validation passes, check the SQL against the redesign rules:
- template + progression mode, not unique-day mode
- variables should hold day-to-day changes where practical
- `replace_slots` should be used for genuine structural differences
- `isTimeSensitive` should reflect the intended catch-up policy
- extra cards should preserve correct ordering with the current resolver
- spec reflection/check-in cards should usually be modeled as `journal`

## 4. Only then turn it into a migration

When the draft is clean, move it into a real migration file under:

`app/supabase/migrations/`

## Current resolver caveat

`add_slots` are appended at the end of the resolved card list by the current resolver.
If a one-off card must appear in the middle of the day flow, model it as an optional base slot and remove it on days that do not need it.
