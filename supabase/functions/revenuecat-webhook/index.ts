// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

console.log("RevenueCat Webhook Function Started!")

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
// REVENUECAT_WEBHOOK_AUTH is a shared secret you will configure in Supabase and RevenueCat
const expectedAuthHeader = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
const APP_SIX_DAY_PROGRAM = "six_day_reset";
const APP_NINETY_DAY_PROGRAM = "ninety_day_transform";
const sixDayEntitlementId = Deno.env.get("RC_6_DAY_ENTITLEMENT_ID") ?? "six_day_control";
const ninetyDayEntitlementId = Deno.env.get("RC_90_DAY_ENTITLEMENT_ID") ?? "ninety_day_quit";
const sixDayProductIds = (Deno.env.get("RC_6_DAY_PRODUCT_IDS") ?? "six_day_control")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
const ninetyDayProductIds = (Deno.env.get("RC_90_DAY_PRODUCT_IDS") ?? "ninety_day_quit")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const isMatchingProduct = (productId: string | null | undefined, candidates: string[]) => {
    const normalizedProductId = productId?.trim().toLowerCase();
    if (!normalizedProductId) return false;

    if (candidates.includes(normalizedProductId)) {
        return true;
    }

    return candidates.some((candidate) => normalizedProductId.includes(candidate));
};

const getProgramSlug = (event: Record<string, unknown>) => {
    const entitlements = Array.isArray(event.entitlements)
        ? event.entitlements as Array<Record<string, unknown>>
        : [];

    const hasNinetyDayEntitlement = entitlements.some((entry) => {
        const entitlementId = typeof entry.id === "string" ? entry.id : null;
        const productIdentifier = typeof entry.product_identifier === "string" ? entry.product_identifier : null;
        return entitlementId === ninetyDayEntitlementId || isMatchingProduct(productIdentifier, ninetyDayProductIds);
    });

    const hasSixDayEntitlement = entitlements.some((entry) => {
        const entitlementId = typeof entry.id === "string" ? entry.id : null;
        const productIdentifier = typeof entry.product_identifier === "string" ? entry.product_identifier : null;
        return entitlementId === sixDayEntitlementId || isMatchingProduct(productIdentifier, sixDayProductIds);
    });

    if (hasNinetyDayEntitlement) {
        return APP_NINETY_DAY_PROGRAM;
    }

    if (hasSixDayEntitlement) {
        return APP_SIX_DAY_PROGRAM;
    }

    const productId = typeof event.product_id === "string" ? event.product_id : null;

    if (isMatchingProduct(productId, ninetyDayProductIds)) {
        return APP_NINETY_DAY_PROGRAM;
    }

    if (isMatchingProduct(productId, sixDayProductIds)) {
        return APP_SIX_DAY_PROGRAM;
    }

    return null;
};

const getLegacyTier = (programSlug: string | null) => {
    if (programSlug === APP_NINETY_DAY_PROGRAM) return "90-day";
    if (programSlug === APP_SIX_DAY_PROGRAM) return "6-day";
    return "free";
};

serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // 1. Basic Authorization to ensure request is from RevenueCat
    const authHeader = req.headers.get('Authorization');
    if (expectedAuthHeader && authHeader !== expectedAuthHeader) {
        console.error("Unauthorized Webhook Attempt");
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const payload = await req.json();
        const event = payload.event;

        if (!event) {
            return new Response('No event found in payload', { status: 400 });
        }

        console.log(`Received RevenueCat Event: ${event.type} for User ID: ${event.app_user_id}`);

        // Create a Supabase client with the Service Role Key to bypass RLS
        // The webhook needs administrative privileges to update the profile table directly
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const eventType = typeof event.type === "string" ? event.type : "";
        const appUserId = typeof event.app_user_id === "string" ? event.app_user_id : "";
        const purchasedProgram = getProgramSlug(event);
        const purchasedProductId = typeof event.product_id === "string" ? event.product_id : null;
        const isPositivePurchaseEvent = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"].includes(eventType);
        const isNegativeLifecycleEvent = ["CANCELLATION", "EXPIRATION"].includes(eventType);

        if (!appUserId) {
            return new Response('No app_user_id found in payload', { status: 400 });
        }

        let newTier = getLegacyTier(purchasedProgram);
        let newStatus = isPositivePurchaseEvent && purchasedProgram ? 'active' : 'inactive';

        if (isNegativeLifecycleEvent && !purchasedProgram) {
            newTier = 'free';
            newStatus = 'expired';
        }

        // 2. Update the Supabase Profile based on `revenuecat_app_user_id` or default `id`
        console.log(`Updating Profile: Status=${newStatus}, Tier=${newTier}`);

        // RevenueCat 'app_user_id' can be mapped to either your Supabase auth.users ID, 
        // or an anonymous anonymous ID. Ideally, your mobile app sends the Supabase user ID 
        // to RevenueCat at signup via `Purchases.logIn()`.
        const profileUpdate: Record<string, unknown> = {
            subscription_tier: newTier,
            subscription_status: newStatus
        };

        if (purchasedProgram) {
            profileUpdate.active_program = purchasedProgram;
        }

        const applyProfileUpdate = async (column: 'id' | 'revenuecat_app_user_id') =>
            await supabase
                .from('profiles')
                .update(profileUpdate)
                .eq(column, appUserId);

        let { error } = await applyProfileUpdate('id');

        if (error) {
            console.error("Database Update Error:", error);
            // Wait, what if the user used a different ID or anonymous user? 
            // We also query against the specific revenuecat_app_user_id column we created just in case
            const { error: fallbackError } = await applyProfileUpdate('revenuecat_app_user_id');

            if (fallbackError) {
                console.error("Fallback Update Error:", fallbackError);
                throw fallbackError;
            }
        }

        if (isPositivePurchaseEvent && purchasedProgram) {
            const { data: existingAccess, error: accessFetchError } = await supabase
                .from('program_access')
                .select('owned_program, completion_state, current_day, completed_at, archived_at')
                .eq('user_id', appUserId)
                .eq('owned_program', purchasedProgram)
                .maybeSingle();

            if (accessFetchError) {
                console.error("Program Access Fetch Error:", accessFetchError);
            }

            const purchaseState =
                existingAccess?.completion_state === 'archived'
                    ? 'owned_archived'
                    : existingAccess?.completion_state === 'completed'
                        ? 'owned_completed'
                        : 'owned_active';

            const completionState = existingAccess?.completion_state ?? 'in_progress';
            const currentDay =
                existingAccess?.owned_program === purchasedProgram && existingAccess?.current_day
                    ? existingAccess.current_day
                    : 1;

            const { error: accessUpsertError } = await supabase
                .from('program_access')
                .upsert({
                    user_id: appUserId,
                    owned_program: purchasedProgram,
                    purchase_state: purchaseState,
                    completion_state: completionState,
                    current_day: currentDay,
                    completed_at: existingAccess?.completed_at ?? null,
                    archived_at: existingAccess?.archived_at ?? null,
                    revenuecat_product_id: purchasedProductId,
                }, { onConflict: 'user_id,owned_program' });

            if (accessUpsertError) {
                console.error("Program Access Upsert Error:", accessUpsertError);
                throw accessUpsertError;
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Webhook processing error:", errorMessage);
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
});
