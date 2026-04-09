# Startup Stale Session Recovery Design

## Problem

When Supabase session hydration encounters a revoked or missing refresh token, the app currently logs an auth error during startup and leaves recovery to the user. On simulators and occasionally on real devices after auth/session changes, this creates repeated noisy boot errors and an unclear signed-out state.

## Goal

Recover automatically from stale local auth state so the app does not keep surfacing the same invalid refresh token error on every launch.

## Approved UX

- Detect the stale-token case during startup session hydration.
- Clear the broken local session automatically.
- Route the user back to the Welcome flow.
- Show a gentle one-time inline message on Welcome: `Your session expired. Please sign in again.`

## Approach

1. In `providers/auth.tsx`, inspect the `error` returned by `supabase.auth.getSession()`.
2. If the auth error code/message indicates an invalid or missing refresh token, perform a local-only Supabase sign out and clear the app's local auth-related caches.
3. Persist a one-time local notice flag before cleanup.
4. In `app/(auth)/welcome.tsx`, read and clear that notice flag on mount, then render a small inline notice above the auth buttons.

## Error Handling

- Only auto-clear sessions for the specific stale-token failure path.
- Keep existing logging for unexpected auth bootstrap errors.
- Make local cleanup best-effort and non-blocking.

## Success Criteria

- Relaunching with a stale refresh token no longer produces a recurring broken-session state.
- The user lands cleanly on Welcome.
- The user gets one calm inline explanation instead of a blocking alert.
