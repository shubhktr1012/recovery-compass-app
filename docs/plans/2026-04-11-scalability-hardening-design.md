# Scalability Hardening Design

Date: 2026-04-11
Branch: `rebuild/multi-program`

## Goal

Strengthen the app for launch and early scale across three layers:

1. Safer writes with cleaner RLS boundaries
2. Lower read pressure through smarter caching
3. Targeted rate limiting on exposed Edge Functions

## Current Risks

- `program_progress` sync still uses a delete-then-insert client write pattern. It works for launch volume, but it is fragile under concurrent devices and makes RLS failures noisy.
- React Query currently treats long-lived content and frequently changing account data too similarly, which creates more Supabase traffic than needed.
- The only custom server endpoints are `delete-account` and `revenuecat-webhook`, but neither currently enforces request throttling.

## Design

## 1. Safer writes and RLS

- Add a `security definer` RPC named `sync_program_progress`.
- The RPC authenticates through `auth.uid()`, validates the program slug against `programs.slug`, normalizes completed days, and atomically merges rows for that user and program.
- Move the app off direct `program_progress` delete+insert writes and call the RPC instead.
- Tighten read policies for `programs` and `program_days` to authenticated users only.
- Normalize key policies to use the `(select auth.uid())` pattern and add any missing delete policies on user-owned tables.
- Add supporting indexes for `program_access`, `program_progress`, and rate-limit lookups.

## 2. Caching

- Keep account-shaped data fresher than content-shaped data.
- Increase content freshness for `programs`, `program`, and `program-day` so the app does not re-read static content every minute.
- Keep persisted query storage conservative for sensitive data and continue to avoid persisting raw journal entries.
- Add explicit query defaults by key prefix so cache behavior is easier to reason about and adjust later.

## 3. Rate limiting

- Add a small Postgres-backed rate-limit table and RPC that Edge Functions can consume with the service role.
- Apply user-scoped throttling to `delete-account`.
- Apply generous app-user scoped throttling to `revenuecat-webhook`.
- Return `429` responses with `retryAfterSeconds` when limits are exceeded.

## Success Criteria

- `program_progress` sync is atomic and no longer depends on client-side delete+insert behavior.
- Content queries stay warm longer and reduce repeat Supabase reads.
- Edge Functions reject abusive bursts without blocking normal review flows.
- TypeScript remains clean and the affected app flows still work.
