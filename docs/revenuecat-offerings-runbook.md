# RevenueCat Offerings Runbook

Last updated: 2026-05-15

This app uses one canonical RevenueCat offering:

- Offering lookup key: `main_production`
- Current offering: yes
- Package shape: six custom packages, one per program
- Product shape: each package has the matching iOS product and Android product attached

## Why this matters

`Purchases.getOfferings()` retrieves all active RevenueCat offerings, not only the
offering the app eventually displays. If stale offerings stay active, the SDK
health report logs warnings for those stale offerings even when purchases from
`main_production` work.

The expected long-term state is:

- `main_production` is the only active offering used by the app.
- Empty legacy offerings such as `default` and `main` are archived.
- Store-specific legacy offerings such as `main_ios` and `main_android` are archived once `main_production` has both platforms attached.
- Do not create new platform-specific offerings unless there is a deliberate experiment and a cleanup date.

## Expected Catalog

| Program | Entitlement lookup key | Store product identifier |
| --- | --- | --- |
| 6-Day Control | `six_day_control` | `six_day_control` |
| 90-Day Smoking Reset | `ninety_day_quit` | `ninety_day_quit` |
| 21-Day Deep Sleep Reset | `sleep_disorder_reset` | `sleep_disorder_reset` |
| 30-Day Men's Vitality Reset | `male_sexual_health` | `male_sexual_health` |
| 90-Day Biohacking Reset | `age_reversal` | `age_reversal` |
| 14-Day Energy Restore | `energy_vitality` | `energy_vitality` |

Each `main_production` package should contain two products:

- the iOS App Store product
- the Android Google Play product

## Interpreting Current Warnings

`No packages could be found for offering default/main`

This means the offering is active but has no store-resolvable packages for the
current device. Archive the offering unless it is intentionally being rebuilt.

`No packages could be found for offering main_android` on iOS, or `main_ios` on Android

This happens when platform-specific offerings remain active. Use
`main_production` instead and archive the platform-specific offering.

`Package '$rc_custom_...' has an unknown duration`

This is expected for this app's current model. These are one-time program
purchases, not subscriptions, and the app references custom packages through
`availablePackages` plus product/package identifiers. Do not try to force six
different program products into one predefined `lifetime` package type.

## Dashboard Change Checklist

Run this before every payment-related release:

1. Open RevenueCat project `Recovery Compass`.
2. Confirm `main_production` is the current offering.
3. Confirm `main_production` has exactly six packages.
4. Confirm each package has exactly one iOS product and one Android product.
5. Confirm each package product identifier matches the table above.
6. Confirm `default`, `main`, `main_ios`, and `main_android` are archived unless explicitly needed for a dated experiment.
7. Confirm each entitlement has the expected iOS and Android products attached.
8. Launch a QA build with `EXPO_PUBLIC_ENABLE_PURCHASE_QA_LOGS=true`.
9. Confirm `[PurchaseQA]` logs map each selected program to the expected product identifier.

## App References

- Canonical offering constant: [lib/revenuecat/identifiers.ts](/Users/shubh/Development/recovery-compass/app/lib/revenuecat/identifiers.ts)
- Offering selection: [app/(auth)/paywall.tsx](/Users/shubh/Development/recovery-compass/app/app/(auth)/paywall.tsx)
- RevenueCat initialization/logging: [app/_layout.tsx](/Users/shubh/Development/recovery-compass/app/app/_layout.tsx)
- Environment variables: [.env.example](/Users/shubh/Development/recovery-compass/app/.env.example)

## Official References

- RevenueCat offerings overview: https://www.revenuecat.com/docs/offerings/overview
- RevenueCat displaying products/packages: https://www.revenuecat.com/docs/displaying-products
- RevenueCat empty offerings troubleshooting: https://www.revenuecat.com/docs/offerings/troubleshooting-offerings
