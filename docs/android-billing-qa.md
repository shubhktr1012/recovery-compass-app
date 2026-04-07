# Android Billing QA

Last updated: April 8, 2026

This runbook is the Android equivalent of the iOS StoreKit simulator verification that is already complete in the repo. The app-side RevenueCat wiring is already in place. The remaining work is validating the real Google Play billing loop end-to-end.

## Current status

- Android package ID: `com.recoverycompass.app`
- Billing permission is enabled in [app.json](/Users/shubh/Development/recovery-compass/app/app.json)
- RevenueCat config selects the Google key on Android in [app/_layout.tsx](/Users/shubh/Development/recovery-compass/app/app/_layout.tsx)
- Public Android RevenueCat key is present locally in `app/.env`
- Google Play merchant profile and internal testing release are marked bootstrapped in [SPRINT_STATUS.md](/Users/shubh/Development/recovery-compass/app/docs/SPRINT_STATUS.md)
- Android internal-track purchase verification completed on a Play-installed build

## Important constraint

Google Play billing should be tested from a Play-distributed build, not a locally sideloaded debug build. A local `expo run:android` install is useful for general app QA, but it is not the source of truth for real purchase verification.

## Preconditions

Before running Android billing QA, confirm all of the following:

- The tester is added to the Google Play internal testing track
- The tester account is also a Google Play license tester
- The device is logged into Play Store with that same tester account
- The installed app comes from Google Play internal testing, not from Android Studio or `adb install`
- The tester has accepted the internal testing opt-in link
- RevenueCat `main_production` is still the current offering with the intended packages attached

## Primary test path

Use `ninety_day_quit` first because it is already the best-verified purchase path on iOS.

1. Install the internal testing build from Google Play
2. Launch the app and sign in with a normal app account
3. Complete the questionnaire until the paywall appears
4. Verify the paywall loads products and prices instead of showing the empty/offering error state
5. Purchase the `ninety_day_quit` product
6. Confirm Google Play completes the transaction
7. Confirm the app routes only after unlock is confirmed
8. Confirm the Program tab opens with access unlocked
9. Confirm Profile shows the expected owned program / purchase state

## Restore path

1. From Profile or Paywall, tap `Restore Purchases`
2. Confirm the owned program remains or is restored successfully
3. If possible, reinstall the Play-distributed build and repeat restore once

## Upgrade path

If the six-day smoking flow is still part of launch QA, also verify:

1. Purchase `six_day_control`
2. Complete enough flow to reach the upgrade state
3. Return to paywall
4. Confirm only the eligible upgrade package is shown
5. Purchase `ninety_day_quit`
6. Confirm access upgrades cleanly

## What success looks like

Android billing QA is complete only when all of the following are true:

- Offerings load on a Play-installed Android build
- Purchase completes through Google Play
- RevenueCat customer info reflects the purchase
- The app waits for confirmed unlock before navigation
- Program access unlocks correctly in-app
- Restore works for the same tester account

## Verified result

Verified on April 8, 2026:

- Google Play purchase drawer opened correctly from the Play-installed internal test build
- Purchase completed successfully through Google Play
- RevenueCat/Google Play service credentials were corrected and purchase acknowledgement started succeeding
- Program unlock completed in-app
- Restore Purchases worked for the same account afterward

## Evidence to capture

Capture these artifacts during QA:

- Screenshot of the paywall with Android-loaded products
- Screenshot of successful Google Play purchase confirmation
- Screenshot of the unlocked program / profile state
- Short note with tested product ID and tester account email
- Any RevenueCat dashboard confirmation if available

## If the Android purchase does not unlock

Check these in order:

1. Was the app installed from Google Play internal testing instead of a local build?
2. Is the Play Store account the same one invited as tester and license tester?
3. Does RevenueCat show the transaction for the expected app user ID?
4. Does `Restore Purchases` recover the entitlement?
5. Is the tester using the same Recovery Compass account that logged into RevenueCat?

## Repo references

- [app/_layout.tsx](/Users/shubh/Development/recovery-compass/app/app/_layout.tsx)
- [paywall.tsx](/Users/shubh/Development/recovery-compass/app/app/paywall.tsx)
- [service.ts](/Users/shubh/Development/recovery-compass/app/lib/access/service.ts)
- [SPRINT_STATUS.md](/Users/shubh/Development/recovery-compass/app/docs/SPRINT_STATUS.md)
