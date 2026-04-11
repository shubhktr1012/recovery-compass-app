// eslint-disable-next-line import/no-unresolved -- resolved via supabase/functions/deno.json import map
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

console.log("RevenueCat Webhook Function Started!");

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
// REVENUECAT_WEBHOOK_AUTH is a shared secret you will configure in Supabase and RevenueCat
const expectedAuthHeader = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
const APP_SIX_DAY_PROGRAM = "six_day_reset";
const APP_NINETY_DAY_PROGRAM = "ninety_day_transform";
const DEFAULT_SIX_DAY_REVENUECAT_ID = "six_day_control";
const DEFAULT_NINETY_DAY_REVENUECAT_ID = "ninety_day_quit";
const SIX_DAY_REVENUECAT_ALIASES = [
    DEFAULT_SIX_DAY_REVENUECAT_ID,
    "6_day_reset",
    "6-day-reset",
    "6dayreset",
    "six_day_reset",
];
const NINETY_DAY_REVENUECAT_ALIASES = [
    DEFAULT_NINETY_DAY_REVENUECAT_ID,
    "90_day_transform",
    "90-day-transform",
    "90daytransform",
    "ninety_day_transform",
    "90_day_quit",
];

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

type RateLimitResult = {
    allowed?: boolean;
    reset_at?: string;
};

type SupabaseAdminClient = {
    rpc: (
        fn: string,
        args: {
            p_bucket: string;
            p_identifier: string;
            p_max_requests: number;
            p_window_seconds: number;
        },
    ) => PromiseLike<{ data: RateLimitResult[] | RateLimitResult | null; error: { message?: string } | null }>;
};

const parseCandidates = (value: string | null | undefined, fallbacks: string[]) =>
    Array.from(
        new Set(
            [value ?? "", ...fallbacks]
                .flatMap((entry) => entry.split(","))
                .map((entry) => normalize(entry))
                .filter(Boolean),
        ),
    );

const sixDayEntitlementIds = parseCandidates(
    Deno.env.get("RC_6_DAY_ENTITLEMENT_ID"),
    SIX_DAY_REVENUECAT_ALIASES,
);
const ninetyDayEntitlementIds = parseCandidates(
    Deno.env.get("RC_90_DAY_ENTITLEMENT_ID"),
    NINETY_DAY_REVENUECAT_ALIASES,
);
const sixDayProductIds = parseCandidates(
    Deno.env.get("RC_6_DAY_PRODUCT_IDS"),
    SIX_DAY_REVENUECAT_ALIASES,
);
const ninetyDayProductIds = parseCandidates(
    Deno.env.get("RC_90_DAY_PRODUCT_IDS"),
    NINETY_DAY_REVENUECAT_ALIASES,
);

const isMatchingProduct = (productId: string | null | undefined, candidates: string[]) => {
    const normalizedProductId = normalize(productId);
    if (!normalizedProductId) return false;

    if (candidates.includes(normalizedProductId)) {
        return true;
    }

    return candidates.some((candidate) => normalizedProductId.includes(candidate));
};

const getProgramSlug = (event: Record<string, unknown>) => {
    const entitlements = Array.isArray(event.entitlements)
        ? event.entitlements as Record<string, unknown>[]
        : [];

    const hasNinetyDayEntitlement = entitlements.some((entry) => {
        const entitlementId = typeof entry.id === "string" ? normalize(entry.id) : null;
        const productIdentifier = typeof entry.product_identifier === "string" ? entry.product_identifier : null;
        return (entitlementId ? ninetyDayEntitlementIds.includes(entitlementId) : false) ||
            isMatchingProduct(productIdentifier, ninetyDayProductIds);
    });

    const hasSixDayEntitlement = entitlements.some((entry) => {
        const entitlementId = typeof entry.id === "string" ? normalize(entry.id) : null;
        const productIdentifier = typeof entry.product_identifier === "string" ? entry.product_identifier : null;
        return (entitlementId ? sixDayEntitlementIds.includes(entitlementId) : false) ||
            isMatchingProduct(productIdentifier, sixDayProductIds);
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

const enforceRateLimit = async (
    supabase: SupabaseAdminClient,
    bucket: string,
    identifier: string,
    maxRequests: number,
    windowSeconds: number,
) => {
    try {
        const { data, error } = await supabase.rpc("consume_rate_limit", {
            p_bucket: bucket,
            p_identifier: identifier,
            p_max_requests: maxRequests,
            p_window_seconds: windowSeconds,
        });

        if (error) {
            throw error;
        }

        const result = Array.isArray(data) ? data[0] : data;
        if (!result?.allowed) {
            const resetAt = typeof result?.reset_at === "string" ? Date.parse(result.reset_at) : NaN;
            const retryAfterSeconds = Number.isFinite(resetAt)
                ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
                : windowSeconds;

            return { allowed: false, retryAfterSeconds };
        }

        return { allowed: true, retryAfterSeconds: 0 };
    } catch (error) {
        console.error("RevenueCat rate limit check failed:", error);
        return { allowed: true, retryAfterSeconds: 0 };
    }
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

        const rateLimit = await enforceRateLimit(
            supabase,
            "revenuecat-webhook:user",
            appUserId,
            120,
            60,
        );

        if (!rateLimit.allowed) {
            return new Response(
                JSON.stringify({
                    error: "Rate limit exceeded",
                    retryAfterSeconds: rateLimit.retryAfterSeconds,
                }),
                {
                    headers: { "Content-Type": "application/json" },
                    status: 429,
                },
            );
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

        const { error } = await applyProfileUpdate('id');

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
