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
const APP_SLEEP_RESET_PROGRAM = "sleep_disorder_reset";
const APP_ENERGY_VITALITY_PROGRAM = "energy_vitality";
const APP_AGE_REVERSAL_PROGRAM = "age_reversal";
const APP_MALE_VITALITY_PROGRAM = "male_sexual_health";
const DEFAULT_SIX_DAY_REVENUECAT_ID = "six_day_control";
const DEFAULT_NINETY_DAY_REVENUECAT_ID = "ninety_day_quit";
const DEFAULT_SLEEP_RESET_REVENUECAT_ID = "sleep_disorder_reset";
const DEFAULT_ENERGY_VITALITY_REVENUECAT_ID = "energy_vitality";
const DEFAULT_AGE_REVERSAL_REVENUECAT_ID = "age_reversal";
const DEFAULT_MALE_VITALITY_REVENUECAT_ID = "male_sexual_health";
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
const SLEEP_RESET_REVENUECAT_ALIASES = [
    DEFAULT_SLEEP_RESET_REVENUECAT_ID,
    "sleep-reset",
    "sleep_reset",
    "sleepdisorderreset",
];
const ENERGY_VITALITY_REVENUECAT_ALIASES = [
    DEFAULT_ENERGY_VITALITY_REVENUECAT_ID,
    "energy-reset",
    "energy_reset",
    "energyvitality",
];
const AGE_REVERSAL_REVENUECAT_ALIASES = [
    DEFAULT_AGE_REVERSAL_REVENUECAT_ID,
    "age-reversal",
    "agereversal",
    "90_day_reversal",
    "biohacking_reset",
];
const MALE_VITALITY_REVENUECAT_ALIASES = [
    DEFAULT_MALE_VITALITY_REVENUECAT_ID,
    "male-vitality",
    "male_vitality",
    "malesexualhealth",
];

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

type RateLimitResult = {
    allowed?: boolean;
    reset_at?: string;
};

type SupabaseRpcClient = {
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

type SupabaseProfileClient = {
    from: (table: string) => any;
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
const sleepResetEntitlementIds = parseCandidates(
    Deno.env.get("RC_SLEEP_RESET_ENTITLEMENT_ID"),
    SLEEP_RESET_REVENUECAT_ALIASES,
);
const energyVitalityEntitlementIds = parseCandidates(
    Deno.env.get("RC_ENERGY_VITALITY_ENTITLEMENT_ID"),
    ENERGY_VITALITY_REVENUECAT_ALIASES,
);
const ageReversalEntitlementIds = parseCandidates(
    Deno.env.get("RC_AGE_REVERSAL_ENTITLEMENT_ID"),
    AGE_REVERSAL_REVENUECAT_ALIASES,
);
const maleVitalityEntitlementIds = parseCandidates(
    Deno.env.get("RC_MALE_VITALITY_ENTITLEMENT_ID"),
    MALE_VITALITY_REVENUECAT_ALIASES,
);
const sleepResetProductIds = parseCandidates(
    Deno.env.get("RC_SLEEP_RESET_PRODUCT_IDS"),
    SLEEP_RESET_REVENUECAT_ALIASES,
);
const energyVitalityProductIds = parseCandidates(
    Deno.env.get("RC_ENERGY_VITALITY_PRODUCT_IDS"),
    ENERGY_VITALITY_REVENUECAT_ALIASES,
);
const ageReversalProductIds = parseCandidates(
    Deno.env.get("RC_AGE_REVERSAL_PRODUCT_IDS"),
    AGE_REVERSAL_REVENUECAT_ALIASES,
);
const maleVitalityProductIds = parseCandidates(
    Deno.env.get("RC_MALE_VITALITY_PRODUCT_IDS"),
    MALE_VITALITY_REVENUECAT_ALIASES,
);

const PROGRAM_MATCHERS = [
    {
        programSlug: APP_NINETY_DAY_PROGRAM,
        entitlementIds: ninetyDayEntitlementIds,
        productIds: ninetyDayProductIds,
    },
    {
        programSlug: APP_SIX_DAY_PROGRAM,
        entitlementIds: sixDayEntitlementIds,
        productIds: sixDayProductIds,
    },
    {
        programSlug: APP_SLEEP_RESET_PROGRAM,
        entitlementIds: sleepResetEntitlementIds,
        productIds: sleepResetProductIds,
    },
    {
        programSlug: APP_ENERGY_VITALITY_PROGRAM,
        entitlementIds: energyVitalityEntitlementIds,
        productIds: energyVitalityProductIds,
    },
    {
        programSlug: APP_AGE_REVERSAL_PROGRAM,
        entitlementIds: ageReversalEntitlementIds,
        productIds: ageReversalProductIds,
    },
    {
        programSlug: APP_MALE_VITALITY_PROGRAM,
        entitlementIds: maleVitalityEntitlementIds,
        productIds: maleVitalityProductIds,
    },
] as const;

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
    const matchedEntitlementProgram = PROGRAM_MATCHERS.find(({ entitlementIds, productIds }) =>
        entitlements.some((entry) => {
            const entitlementId = typeof entry.id === "string" ? normalize(entry.id) : null;
            const productIdentifier = typeof entry.product_identifier === "string" ? entry.product_identifier : null;
            return (entitlementId ? entitlementIds.includes(entitlementId) : false) ||
                isMatchingProduct(productIdentifier, productIds);
        })
    );

    if (matchedEntitlementProgram) {
        return matchedEntitlementProgram.programSlug;
    }

    const productId = typeof event.product_id === "string" ? event.product_id : null;
    const matchedProductProgram = PROGRAM_MATCHERS.find(({ productIds }) =>
        isMatchingProduct(productId, productIds)
    );

    if (matchedProductProgram) {
        return matchedProductProgram.programSlug;
    }

    return null;
};

const enforceRateLimit = async (
    supabase: SupabaseRpcClient,
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

const resolveProfileIdentity = async (
    supabase: SupabaseProfileClient,
    appUserId: string,
) => {
    const findByColumn = async (column: 'id' | 'revenuecat_app_user_id') => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, revenuecat_app_user_id')
            .eq(column, appUserId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data as { id: string; revenuecat_app_user_id: string | null } | null;
    };

    const directProfile = await findByColumn('id');
    if (directProfile) {
        return {
            profileId: directProfile.id,
            matchedOn: 'id' as const,
            revenueCatAppUserId: directProfile.revenuecat_app_user_id,
        };
    }

    const fallbackProfile = await findByColumn('revenuecat_app_user_id');
    if (fallbackProfile) {
        return {
            profileId: fallbackProfile.id,
            matchedOn: 'revenuecat_app_user_id' as const,
            revenueCatAppUserId: fallbackProfile.revenuecat_app_user_id,
        };
    }

    return null;
};

serve(async (req: Request) => {
    if (req.method !== 'POST') {
        console.error('RevenueCat webhook rejected non-POST request', { method: req.method });
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
            console.error('RevenueCat webhook rejected payload without event', {
                payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload as Record<string, unknown>) : [],
            });
            return new Response('No event found in payload', { status: 400 });
        }

        console.log(`Received RevenueCat Event: ${event.type} for User ID: ${event.app_user_id}`);

        // Create a Supabase client with the Service Role Key to bypass RLS
        // The webhook needs administrative privileges to update the profile table directly
        const supabase = createClient(supabaseUrl, supabaseServiceKey) as unknown as SupabaseRpcClient & SupabaseProfileClient;

        const eventType = typeof event.type === "string" ? event.type : "";
        const appUserId = typeof event.app_user_id === "string" ? event.app_user_id : "";
        const purchasedProgram = getProgramSlug(event);
        const purchasedProductId = typeof event.product_id === "string" ? event.product_id : null;
        const isPositivePurchaseEvent = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"].includes(eventType);
        const isNegativeLifecycleEvent = ["CANCELLATION", "EXPIRATION"].includes(eventType);

        console.log("RevenueCat normalized event", {
            eventType,
            appUserId,
            purchasedProgram,
            purchasedProductId,
            isPositivePurchaseEvent,
            isNegativeLifecycleEvent,
        });

        if (!appUserId) {
            const isTransferEvent = eventType === "TRANSFER";
            if (isTransferEvent) {
                console.warn("RevenueCat transfer event missing app_user_id; skipping profile sync", {
                    eventType,
                    original_app_user_id: typeof event.original_app_user_id === 'string' ? event.original_app_user_id : null,
                    aliases: Array.isArray(event.aliases) ? event.aliases : null,
                    transferred_from: Array.isArray(event.transferred_from) ? event.transferred_from : null,
                    transferred_to: Array.isArray(event.transferred_to) ? event.transferred_to : null,
                });
                return new Response(JSON.stringify({ ignored: true, reason: 'transfer_without_app_user_id' }), {
                    headers: { "Content-Type": "application/json" },
                    status: 200,
                });
            }

            console.error('RevenueCat webhook rejected event without app_user_id', {
                eventType,
                original_app_user_id: typeof event.original_app_user_id === 'string' ? event.original_app_user_id : null,
                aliases: Array.isArray(event.aliases) ? event.aliases : null,
                transferred_from: Array.isArray(event.transferred_from) ? event.transferred_from : null,
                transferred_to: Array.isArray(event.transferred_to) ? event.transferred_to : null,
            });
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

        // 2. Resolve the canonical Supabase profile id for this RevenueCat user.
        const resolvedProfile = await resolveProfileIdentity(supabase, appUserId);

        if (!resolvedProfile) {
            console.error("RevenueCat webhook could not resolve a profile for app_user_id", {
                appUserId,
                eventType,
                purchasedProgram,
                purchasedProductId,
            });
            throw new Error(`No profile found for RevenueCat app_user_id: ${appUserId}`);
        }

        const resolvedProfileId = resolvedProfile.profileId;

        console.log("RevenueCat resolved profile identity", {
            appUserId,
            resolvedProfileId,
            matchedOn: resolvedProfile.matchedOn,
        });

        const profileUpdatePayload: Record<string, unknown> = {};

        if (!resolvedProfile.revenueCatAppUserId) {
            profileUpdatePayload.revenuecat_app_user_id = appUserId;
        }

        if (Object.keys(profileUpdatePayload).length > 0) {
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update(profileUpdatePayload)
                .eq('id', resolvedProfileId);

            if (profileUpdateError) {
                console.error("Database Update Error:", profileUpdateError);
                throw profileUpdateError;
            }
        }

        if (isPositivePurchaseEvent && purchasedProgram) {
            console.log("RevenueCat attempting program_access upsert", {
                appUserId,
                resolvedProfileId,
                purchasedProgram,
                purchasedProductId,
            });

            const { data: existingAccess, error: accessFetchError } = await supabase
                .from('program_access')
                .select('owned_program, completion_state, current_day, completed_at, archived_at')
                .eq('user_id', resolvedProfileId)
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
                    user_id: resolvedProfileId,
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

            console.log("RevenueCat program_access upsert completed", {
                appUserId,
                resolvedProfileId,
                purchasedProgram,
                purchaseState,
                completionState,
                currentDay,
            });
        } else if (isPositivePurchaseEvent) {
            console.warn("RevenueCat positive purchase event did not resolve to a known program", {
                appUserId,
                eventType,
                purchasedProductId,
            });
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
