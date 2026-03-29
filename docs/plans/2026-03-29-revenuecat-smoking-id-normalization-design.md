# RevenueCat Smoking ID Normalization

Date: 2026-03-29
Status: Approved
Branch: `rebuild/multi-program`

## Scope

Normalize the smoking RevenueCat identifier defaults across the mobile app and
the Supabase webhook so the canonical configuration is:

- `six_day_control`
- `ninety_day_quit`

## Goals

- keep one canonical identifier convention in app envs, docs, and webhook
- preserve backward compatibility for older smoking IDs that may still appear
  in RevenueCat events or stale local config
- reduce future drift by centralizing app-side defaults

## Non-Goals

- do not rename internal program slugs like `six_day_reset` or
  `ninety_day_transform`
- do not rewrite historical SQL migrations or existing stored data
- do not expand the webhook to support the full six-program catalog in this pass

## Design

### Canonical Defaults

The canonical smoking RevenueCat identifiers are:

- entitlement / product: `six_day_control`
- entitlement / product: `ninety_day_quit`

These values should be the default fallback values used by the Expo app config
layer and by the Supabase RevenueCat webhook.

### App Runtime

App-side defaults should be defined in one shared constants module and used by:

- `lib/env.ts`
- `lib/revenuecat/catalog.ts`

The catalog should continue to accept older aliases such as `6_day_reset` and
`90_day_transform`, but those are compatibility inputs, not the documented
configuration target.

### Webhook Matching

The webhook should keep canonical defaults, but matching logic must recognize
legacy smoking aliases in case RevenueCat sends older product IDs or
entitlement IDs.

That means:

- configured env values stay canonical by default
- entitlement matching uses canonical IDs plus legacy aliases
- product matching uses canonical IDs plus legacy aliases

### Docs and Samples

Public documentation and `.env.example` should show only the canonical smoking
IDs so the repo communicates one recommended configuration path.

## Validation

- inspect diffs for env defaults and docs
- search the repo for smoking default fallbacks
- run type-checking if practical
