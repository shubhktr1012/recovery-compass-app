# Commerce Reliability Checklist

Last updated: 2026-04-18

This is the trimmed launch view of the website checkout -> entitlement -> app hydration path.

## Keep For Launch

These are the parts we should absolutely keep:

1. Checkout must bind to the authenticated website session user.
   This prevents client-side `userId` spoofing and keeps commerce rows tied to the real account.

2. App entitlement hydration must fall back to Supabase.
   This is what makes a website purchase appear in the app even when RevenueCat is not immediately available.

3. Payment fulfillment must stay idempotent.
   Verify and webhook retries are normal, so repeated processing must not create broken state.

4. Lightweight route-level tests should stay.
   They are cheap to maintain and protect the highest-risk purchase paths.

## Optional For Launch

These are useful, but not required on day one:

1. Reconciliation endpoint and retry scripts
2. Fulfillment health endpoint
3. Ops alert emails for failed fulfillment
4. Cron-based 5-minute monitoring

We already have these pieces in the repo, but they do not need to be turned on before launch unless you want extra safety during launch week.

## Minimal Launch Checklist

1. Run `cd web && npm run test`
2. Run `cd web && npx tsc --noEmit`
3. Run `cd app && npm run typecheck`
4. Do one real web purchase and verify:
   - `transactions.payment_status = 'paid'`
   - `transactions.fulfillment_status = 'fulfilled'`
   - matching `program_access` row exists
5. Cold-start the app with the same account and confirm:
   - onboarding only if `onboarding_complete = false`
   - no paywall if entitlement exists
   - active program appears correctly

## Manual QA: Questionnaire Re-Alignment

Use this when validating cross-surface purchases against app onboarding context.

1. Recommended-program purchase path
   - Complete onboarding in the app
   - Buy the same recommended program
   - Confirm the app does not ask for re-alignment
   - Confirm the user lands directly in the unlocked Program flow

2. Different-program purchase path
   - Complete onboarding in the app for Program A
   - Buy Program B on the website using the same account
   - Reopen or foreground the app
   - Confirm the app routes to the short re-alignment questionnaire
   - Confirm it does not show paywall again
   - Confirm saving the re-alignment sends the user to the Program tab
   - Confirm `profiles.recommended_program` now matches the purchased journey

3. Smoking-family exception
   - Complete onboarding for `six_day_reset`
   - Buy `ninety_day_transform`
   - Confirm no re-alignment is triggered
   - Reason: both belong to the same smoking journey

4. Missing quick-profile fallback
   - Test with an older user missing name/age/gender in `questionnaire_answers.quickProfile`
   - Confirm re-alignment asks for quick profile first, then the program-specific questions

5. No stale draft leakage
   - Start a normal onboarding draft, then test a purchased-program re-alignment
   - Confirm the re-alignment flow does not restore the old paywall-return draft
   - Confirm a later normal onboarding resume still behaves normally

## Manual SQL Checks

```sql
select id, provider_order_id, payment_status, fulfillment_status, updated_at
from public.transactions
where payment_status = 'paid'
order by updated_at desc
limit 20;
```

```sql
select t.id as transaction_id, t.provider_order_id, t.user_id, t.fulfillment_status, pa.owned_program, pa.purchase_state
from public.transactions t
left join public.program_access pa on pa.user_id = t.user_id
where t.payment_status = 'paid'
order by t.updated_at desc
limit 20;
```

## If We Want Extra Safety Later

Turn these on after launch or during launch week:

1. `POST /api/checkout/reconcile-fulfillment`
2. `GET /api/checkout/fulfillment-health`
3. `web/scripts/reconcile-fulfillment.sh`
4. `web/scripts/check-fulfillment-health.sh`
5. Cron/systemd scheduling for those scripts
