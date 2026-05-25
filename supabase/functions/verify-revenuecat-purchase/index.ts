/* eslint-disable import/no-unresolved */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const revenueCatApiKeys = Array.from(
  new Set(
    [
      Deno.env.get("REVENUECAT_SECRET_API_KEY"),
      Deno.env.get("REVENUECAT_REST_API_KEY"),
      Deno.env.get("REVENUECAT_API_KEY"),
      Deno.env.get("REVENUECAT_APPLE_PUBLIC_API_KEY"),
      Deno.env.get("REVENUECAT_GOOGLE_PUBLIC_API_KEY"),
      Deno.env.get("EXPO_PUBLIC_REVENUECAT_APPLE_KEY"),
      Deno.env.get("EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY"),
    ]
      .map((candidate) => candidate?.trim() ?? "")
      .filter(Boolean),
  ),
);

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() ?? "";

const APP_SIX_DAY_PROGRAM = "six_day_reset";
const APP_NINETY_DAY_PROGRAM = "ninety_day_transform";
const APP_SLEEP_RESET_PROGRAM = "sleep_disorder_reset";
const APP_ENERGY_VITALITY_PROGRAM = "energy_vitality";
const APP_AGE_REVERSAL_PROGRAM = "age_reversal";
const APP_MALE_VITALITY_PROGRAM = "male_sexual_health";

const DEFAULT_SIX_DAY_REVENUECAT_ID = "six_day_control";
const DEFAULT_NINETY_DAY_REVENUECAT_ID = "ninety_day_quit";
const DEFAULT_SLEEP_RESET_REVENUECAT_ID = "sleep_disorder_reset";
const DEFAULT_ENERGY_VITALITY_ID = "energy_vitality";
const DEFAULT_AGE_REVERSAL_ID = "age_reversal";
const DEFAULT_MALE_VITALITY_ID = "male_sexual_health";

const parseCandidates = (value: string | null | undefined, fallbacks: string[]) =>
  Array.from(
    new Set(
      [value ?? "", ...fallbacks]
        .flatMap((entry) => entry.split(","))
        .map((entry) => normalize(entry))
        .filter(Boolean),
    ),
  );

const PROGRAM_MATCHERS = [
  {
    programSlug: APP_NINETY_DAY_PROGRAM,
    entitlementIds: parseCandidates(Deno.env.get("RC_90_DAY_ENTITLEMENT_ID"), [
      DEFAULT_NINETY_DAY_REVENUECAT_ID,
      "90_day_transform",
      "90-day-transform",
      "90daytransform",
      "ninety_day_transform",
      "90_day_quit",
    ]),
    productIds: parseCandidates(Deno.env.get("RC_90_DAY_PRODUCT_IDS"), [
      DEFAULT_NINETY_DAY_REVENUECAT_ID,
      "90_day_transform",
      "90-day-transform",
      "90daytransform",
      "ninety_day_transform",
      "90_day_quit",
    ]),
  },
  {
    programSlug: APP_SIX_DAY_PROGRAM,
    entitlementIds: parseCandidates(Deno.env.get("RC_6_DAY_ENTITLEMENT_ID"), [
      DEFAULT_SIX_DAY_REVENUECAT_ID,
      "6_day_reset",
      "6-day-reset",
      "6dayreset",
      "six_day_reset",
    ]),
    productIds: parseCandidates(Deno.env.get("RC_6_DAY_PRODUCT_IDS"), [
      DEFAULT_SIX_DAY_REVENUECAT_ID,
      "6_day_reset",
      "6-day-reset",
      "6dayreset",
      "six_day_reset",
    ]),
  },
  {
    programSlug: APP_SLEEP_RESET_PROGRAM,
    entitlementIds: parseCandidates(Deno.env.get("RC_SLEEP_RESET_ENTITLEMENT_ID"), [
      DEFAULT_SLEEP_RESET_REVENUECAT_ID,
      "sleep-reset",
      "sleep_reset",
      "sleepdisorderreset",
    ]),
    productIds: parseCandidates(Deno.env.get("RC_SLEEP_RESET_PRODUCT_IDS"), [
      DEFAULT_SLEEP_RESET_REVENUECAT_ID,
      "sleep-reset",
      "sleep_reset",
      "sleepdisorderreset",
    ]),
  },
  {
    programSlug: APP_ENERGY_VITALITY_PROGRAM,
    entitlementIds: parseCandidates(Deno.env.get("RC_ENERGY_VITALITY_ENTITLEMENT_ID"), [
      DEFAULT_ENERGY_VITALITY_ID,
      "energy-reset",
      "energy_reset",
      "energyvitality",
    ]),
    productIds: parseCandidates(Deno.env.get("RC_ENERGY_VITALITY_PRODUCT_IDS"), [
      DEFAULT_ENERGY_VITALITY_ID,
      "energy-reset",
      "energy_reset",
      "energyvitality",
    ]),
  },
  {
    programSlug: APP_AGE_REVERSAL_PROGRAM,
    entitlementIds: parseCandidates(Deno.env.get("RC_AGE_REVERSAL_ENTITLEMENT_ID"), [
      DEFAULT_AGE_REVERSAL_ID,
      "age-reversal",
      "agereversal",
      "90_day_reversal",
      "biohacking_reset",
    ]),
    productIds: parseCandidates(Deno.env.get("RC_AGE_REVERSAL_PRODUCT_IDS"), [
      DEFAULT_AGE_REVERSAL_ID,
      "age-reversal",
      "agereversal",
      "90_day_reversal",
      "biohacking_reset",
    ]),
  },
  {
    programSlug: APP_MALE_VITALITY_PROGRAM,
    entitlementIds: parseCandidates(Deno.env.get("RC_MALE_VITALITY_ENTITLEMENT_ID"), [
      DEFAULT_MALE_VITALITY_ID,
      "male-vitality",
      "male_vitality",
      "malesexualhealth",
    ]),
    productIds: parseCandidates(Deno.env.get("RC_MALE_VITALITY_PRODUCT_IDS"), [
      DEFAULT_MALE_VITALITY_ID,
      "male-vitality",
      "male_vitality",
      "malesexualhealth",
    ]),
  },
] as const;

type ProgramSlug = typeof PROGRAM_MATCHERS[number]["programSlug"];

type RevenueCatEntitlement = {
  expires_date?: string | null;
  product_identifier?: string | null;
};

type RevenueCatSubscription = {
  expires_date?: string | null;
  product_identifier?: string | null;
};

type RevenueCatNonSubscriptionPurchase = {
  purchase_date?: string | null;
  product_identifier?: string | null;
};

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscription>;
    non_subscriptions?: Record<string, RevenueCatNonSubscriptionPurchase[]>;
  };
};

type VerifiedProgram = {
  programSlug: ProgramSlug;
  productId: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

function isValidProgramSlug(value: string): value is ProgramSlug {
  return PROGRAM_MATCHERS.some((matcher) => matcher.programSlug === value);
}

function isActiveUntil(expiresDate: string | null | undefined) {
  if (!expiresDate) {
    return true;
  }

  const timestamp = Date.parse(expiresDate);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function isMatchingProduct(productId: string | null | undefined, candidates: readonly string[]) {
  const normalizedProductId = normalize(productId);
  if (!normalizedProductId) return false;

  if (candidates.includes(normalizedProductId)) {
    return true;
  }

  return candidates.some((candidate) => normalizedProductId.includes(candidate));
}

function findVerifiedProgram(
  payload: RevenueCatSubscriberResponse,
  requestedProgram: ProgramSlug,
): VerifiedProgram | null {
  const subscriber = payload.subscriber;
  if (!subscriber) {
    return null;
  }

  const requestedMatcher = PROGRAM_MATCHERS.find((matcher) => matcher.programSlug === requestedProgram);
  if (!requestedMatcher) {
    return null;
  }

  for (const [entitlementId, entitlement] of Object.entries(subscriber.entitlements ?? {})) {
    if (!isActiveUntil(entitlement.expires_date)) {
      continue;
    }

    const entitlementMatches = requestedMatcher.entitlementIds.includes(normalize(entitlementId));
    const productMatches = isMatchingProduct(entitlement.product_identifier, requestedMatcher.productIds);

    if (entitlementMatches || productMatches) {
      return {
        programSlug: requestedProgram,
        productId: entitlement.product_identifier ?? null,
      };
    }
  }

  for (const [productId, subscription] of Object.entries(subscriber.subscriptions ?? {})) {
    if (!isActiveUntil(subscription.expires_date)) {
      continue;
    }

    if (
      isMatchingProduct(productId, requestedMatcher.productIds) ||
      isMatchingProduct(subscription.product_identifier, requestedMatcher.productIds)
    ) {
      return {
        programSlug: requestedProgram,
        productId: subscription.product_identifier ?? productId,
      };
    }
  }

  for (const [productId, purchases] of Object.entries(subscriber.non_subscriptions ?? {})) {
    if (!Array.isArray(purchases) || purchases.length === 0) {
      continue;
    }

    if (
      isMatchingProduct(productId, requestedMatcher.productIds) ||
      purchases.some((purchase) => isMatchingProduct(purchase.product_identifier, requestedMatcher.productIds))
    ) {
      return {
        programSlug: requestedProgram,
        productId,
      };
    }
  }

  return null;
}

async function fetchRevenueCatSubscriber(appUserId: string, apiKey: string) {
  if (!apiKey) {
    throw new Error("Missing RevenueCat API key");
  }

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`RevenueCat subscriber lookup failed: ${response.status} ${bodyText}`);
  }

  return await response.json() as RevenueCatSubscriberResponse;
}

async function enforceRateLimit(
  supabaseAdmin: any,
  userId: string,
) {
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_bucket: "verify-revenuecat-purchase:user",
    p_identifier: userId,
    p_max_requests: 12,
    p_window_seconds: 300,
  });

  if (error) {
    console.error("Verify purchase rate limit check failed", error);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: boolean; reset_at?: string }
    | null
    | undefined;
  if (!result?.allowed) {
    const resetAt = typeof result?.reset_at === "string" ? Date.parse(result.reset_at) : NaN;
    const retryAfterSeconds = Number.isFinite(resetAt)
      ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
      : 300;
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return jsonResponse({ error: "Missing Supabase function configuration" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!accessToken) {
    return jsonResponse({ error: "Missing bearer token" }, 401);
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: userError?.message ?? "Unauthorized" }, 401);
  }

  let body: { programSlug?: unknown } = {};

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const requestedProgram = typeof body.programSlug === "string" ? normalize(body.programSlug) : "";
  if (!isValidProgramSlug(requestedProgram)) {
    return jsonResponse({ error: "Unknown programSlug" }, 400);
  }

  const rateLimit = await enforceRateLimit(supabaseAdmin, user.id);
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        error: "Too many purchase verification attempts. Please try again shortly.",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      429,
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, revenuecat_app_user_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Verify purchase profile lookup failed", profileError);
    return jsonResponse({ error: "Could not load profile" }, 500);
  }

  const candidateAppUserIds = Array.from(
    new Set(
      [user.id, typeof profile?.revenuecat_app_user_id === "string" ? profile.revenuecat_app_user_id : ""]
        .map((candidate) => candidate.trim())
        .filter(Boolean),
    ),
  );

  let verifiedProgram: VerifiedProgram | null = null;
  let matchedRevenueCatAppUserId: string | null = null;
  let lastLookupError: unknown = null;

  if (revenueCatApiKeys.length === 0) {
    return jsonResponse({ error: "Missing RevenueCat API key configuration" }, 500);
  }

  for (const appUserId of candidateAppUserIds) {
    for (const apiKey of revenueCatApiKeys) {
      try {
        const subscriber = await fetchRevenueCatSubscriber(appUserId, apiKey);
        const candidateProgram = findVerifiedProgram(subscriber, requestedProgram);

        if (candidateProgram) {
          verifiedProgram = candidateProgram;
          matchedRevenueCatAppUserId = appUserId;
          break;
        }
      } catch (error) {
        lastLookupError = error;
        console.error("RevenueCat subscriber lookup failed", {
          userId: user.id,
          appUserId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (verifiedProgram) {
      break;
    }
  }

  if (!verifiedProgram || !matchedRevenueCatAppUserId) {
    if (lastLookupError) {
      return jsonResponse({ error: "Could not verify purchase with RevenueCat" }, 502);
    }

    return jsonResponse({ error: "No active RevenueCat entitlement found for this program" }, 403);
  }

  const { data: grantRows, error: grantError } = await supabaseAdmin.rpc(
    "record_verified_owned_program_purchase",
    {
      p_user_id: user.id,
      p_program_id: verifiedProgram.programSlug,
      p_revenuecat_app_user_id: matchedRevenueCatAppUserId,
      p_revenuecat_product_id: verifiedProgram.productId,
    },
  );

  if (grantError) {
    console.error("Verified purchase grant failed", {
      userId: user.id,
      programSlug: verifiedProgram.programSlug,
      error: grantError.message,
    });
    return jsonResponse({ error: "Could not grant verified purchase" }, 500);
  }

  const access = Array.isArray(grantRows) ? grantRows[0] ?? null : grantRows;

  return jsonResponse({
    success: true,
    revenueCatAppUserId: matchedRevenueCatAppUserId,
    access,
  });
});
