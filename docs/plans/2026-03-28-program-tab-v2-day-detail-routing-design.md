# Program Tab V2 Day Detail Routing Design

Date: 2026-03-28
Status: Approved
Branch: `rebuild/multi-program`

## Scope

Change only the unlocked day tap target in `app/(tabs)/program.tsx`.

## Decision

Unlocked day cards should navigate to the top-level V2 route:

`/day-detail?programSlug=${activeProgram}&dayNumber=${day.dayNumber}`

Locked day behavior remains unchanged. The legacy nested route file stays in
place for now and is not modified in this slice.

## Verification

- Unlocked day opens the V2 PagerView day-detail screen
- Locked day remains non-tappable
- Back from V2 day-detail returns to the Program tab
