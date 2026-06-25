# App Routing and Database Hardening Audit

Date: 2026-06-13

Scope: app release-safety pass for user-facing route dead ends and production database drift. Website/admin routing is out of scope.

## Routing Changes

- Added `RouteLoadingState` and `RouteErrorState` so high-level app screens show a visible state instead of a blank screen during auth/profile/content delays.
- Replaced route-level blank returns in Home, Program, and Free Detox program views with explicit loading or fallback screens.
- Replaced the stale `PanicButton` navigation target from `/modal` to the Program tab.
- Added a route inventory test that checks hard-coded internal route targets against the current Expo Router tree and approved legacy redirects.

## Route Inventory Coverage

Covered app route groups:

- Auth: `/welcome`, `/sign-in`, `/sign-up`, `/reset-password`, `/paywall`, `/personalization`
- Tabs: `/`, `/program`, `/journal`, `/profile`
- Account: `/account/programs`, `/account/settings`, `/account/statistics`, `/account/citations`
- Program flow: `/day-detail`, `/program-start`, `/program-complete`, `/program-queue-review`, `/notification-permission-review`
- Legacy redirect: `/program/:programSlug/:dayNumber`

Intentional external route exceptions remain allowed for `https:`, `mailto:`, and `tel:`.

## Production Database Diagnostics

Read-only diagnostics were run against the linked production database.

Data consistency checks returned no rows for:

- Active/legacy program slug mismatches across `programs`, `program_days`, access/progress/preferences/day-state tables, transactions, and profile recommendation fields.
- Missing active program-day rows.
- Unknown `program_days` or progress slugs.
- Unknown `program_access.owned_program` rows.
- Duplicate `program_access` rows per user/program.
- Impossible lifecycle combinations for completed/active/archived program access.
- `free_detox_reset` rows in `program_access`.
- Unexpected `free_program_progress` slugs.
- Public tables with RLS disabled.

The only database finding was RPC permission hygiene:

- Public `SECURITY DEFINER` functions are expected in this app because program lifecycle actions need controlled writes behind RLS.
- The live RPCs checked have `SET search_path = public`.
- App-owned user RPCs checked have authenticated caller gates and ownership/status checks.
- Service-only RPCs such as `admin_grant_program_access`, `record_verified_owned_program_purchase`, and `consume_rate_limit` are not granted to `authenticated`.
- `pause_program_manually(text, integer, timestamptz)` and `resume_program_from_pause(text, timestamptz, date)` still have explicit `anon` execute grants in production. They reject unauthenticated callers internally via `auth.uid()`, but the safer next migration should revoke `anon` explicitly.

## Migration Decision

No database migration is included in this app routing commit.

Reason: production already has the deferred WhatsApp foundation migration version `20260612105043` applied, while the WhatsApp files are intentionally not part of this app release slice. Adding a later migration now without committing that prior migration would make migration history harder to reproduce. The `anon` revoke should be handled in the next server/WhatsApp database slice, together with the already-applied WhatsApp migration files.

Recommended next DB hardening SQL:

```sql
REVOKE ALL ON FUNCTION public.pause_program_manually(text, integer, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.resume_program_from_pause(text, timestamptz, date) FROM anon;
NOTIFY pgrst, 'reload schema';
```

## Manual Smoke Checklist

Android and iOS/TestFlight smoke targets:

1. Launch logged out and confirm auth routes show visible screens.
2. Sign in as a free-tier user and confirm Home, Program tab, Free Detox Day 1, completed Day 1, and reopened Day 1 all render visibly.
3. Sign in as a paid active user and confirm Home current card, Program timeline, Day Detail, Journal day link, Profile, and My Programs actions render visibly.
4. Open an invalid/stale day-detail route and confirm it redirects to paywall, review, Program tab, or an error state rather than a blank screen.
5. Open legacy `/program/:slug/:dayNumber` links and confirm they redirect to `/day-detail` or Program tab.
6. Tap notification review, queue review, paywall return, program start, and program complete CTAs and confirm every action has a visible destination.
7. Pause/resume a program and confirm the Program tab stays visible through loading and sync.

## Acceptance

- Static route audit is covered by `lib/__tests__/route-inventory.test.ts`.
- Route-level loading/fallback states are visible for the highest-risk app entry screens.
- Production data diagnostics found no access/progress/catalog consistency issue requiring an immediate migration.
- The only DB action is a documented low-risk RPC grant cleanup for the next database slice.
