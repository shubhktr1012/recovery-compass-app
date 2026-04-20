# Journal And Reflections QA

Last updated: 2026-04-18

This checklist covers the current Journal page behavior after:
- one-entry-per-day journal updates/deletes
- read-only `Reflections` archive
- `Open in Program` routing from reflections

## Preconditions

- Sign in with a real user that has app access
- Ideally use a user with:
  - at least one existing `journal_entries` row
  - at least one existing `program_reflections` row

## Journal Entry Flow

1. Open `Journal`
2. Confirm the composer is visible at the top
3. Confirm the page copy is brief and the page is not text-heavy
4. If there is no entry for today:
   - enter mood, cravings, reflection
   - tap `Save Entry`
   - confirm success alert appears
   - confirm the form resets to empty
   - confirm a `Today's Entry` helper box appears with `Open Today's Entry`
5. Tap `Open Today's Entry`
   - confirm the saved content loads into the form
   - confirm CTA says `Update Entry`
6. Change the reflection and save again
   - confirm success alert appears
   - confirm the form resets again
   - confirm reopening today's entry shows the latest saved version

## Journal Archive Flow

1. In the archive switch, keep `Journal Entries` selected
2. Confirm existing entries render newest first
3. Tap `Edit` on an older entry
   - confirm that entry loads into the composer
   - confirm the editing banner shows the selected date
   - update and save
   - confirm the archive reflects the new text
4. Tap `Delete` on a non-today entry
   - confirm the destructive confirmation appears
   - confirm the entry disappears after deletion
5. If deleting today's entry:
   - confirm the form clears
   - confirm `Open Today's Entry` disappears

## Reflections Archive Flow

1. Switch archive to `Reflections`
2. Confirm reflection cards render with:
   - program name
   - day number
   - prompt
   - saved reflection
   - updated date
3. Tap `Open in Program`
   - confirm app routes to the matching `day-detail`
   - confirm the saved reflection still appears inside that day card
4. Confirm there is no edit/delete action in the Journal page reflections list

## Query / State Checks

1. After saving a journal entry:
   - `journal-entries`
   - `journal-today`
   - `journal-count`
   should all reflect the new state
2. After deleting a journal entry:
   - the same three queries should refresh correctly
3. Reflections archive should load even when journal archive is empty

## Known Current Limitation

- `Open in Program` routes to the correct day, not directly to the exact reflection card index.
- This is acceptable for now because the reflections archive is intentionally read-only and lightweight.
