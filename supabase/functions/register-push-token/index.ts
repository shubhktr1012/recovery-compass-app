/* eslint-disable import/no-unresolved */

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables for register-push-token");
}

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

type RegisterPushTokenRequest = {
  appBuildNumber?: unknown;
  appVersion?: unknown;
  deviceModel?: unknown;
  deviceName?: unknown;
  expoPushToken?: unknown;
  platform?: unknown;
  projectId?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function normalizePlatform(value: unknown) {
  const platform = asTrimmedString(value)?.toLowerCase();
  return platform === "ios" || platform === "android" || platform === "web"
    ? platform
    : "unknown";
}

function isExpoPushToken(value: string) {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(value);
}

async function enforceRateLimit(supabaseAdmin: any, userId: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
      p_bucket: "push-token-register:user",
      p_identifier: userId,
      p_max_requests: 30,
      p_window_seconds: 60 * 60,
    });

    if (error) {
      throw error;
    }

    const result = (Array.isArray(data) ? data[0] : data) as
      | { allowed?: boolean; reset_at?: string }
      | null
      | undefined;

    if (!result?.allowed) {
      const resetAt = typeof result?.reset_at === "string" ? Date.parse(result.reset_at) : NaN;
      const retryAfterSeconds = Number.isFinite(resetAt)
        ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
        : 60 * 60;

      return { allowed: false, retryAfterSeconds };
    }
  } catch (error) {
    console.warn("Push token register rate limit skipped:", error);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
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

  const rateLimit = await enforceRateLimit(supabaseAdmin, user.id);
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        error: "Too many push token registrations. Please try again later.",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      429,
    );
  }

  let body: RegisterPushTokenRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const expoPushToken = asTrimmedString(body.expoPushToken);
  if (!expoPushToken || !isExpoPushToken(expoPushToken)) {
    return jsonResponse({ error: "Invalid Expo push token" }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from("push_device_tokens")
    .upsert(
      {
        app_build_number: asTrimmedString(body.appBuildNumber),
        app_version: asTrimmedString(body.appVersion),
        device_model: asTrimmedString(body.deviceModel),
        device_name: asTrimmedString(body.deviceName),
        disabled_at: null,
        disabled_reason: null,
        expo_push_token: expoPushToken,
        is_disabled: false,
        last_seen_at: new Date().toISOString(),
        platform: normalizePlatform(body.platform),
        project_id: asTrimmedString(body.projectId),
        user_id: user.id,
      },
      {
        onConflict: "user_id,expo_push_token",
      },
    )
    .select("id, last_seen_at, platform")
    .single();

  if (error) {
    console.error("Push token registration failed:", {
      code: error.code,
      message: error.message,
      userId: user.id,
    });
    return jsonResponse({ error: "Push token registration failed" }, 500);
  }

  return jsonResponse({
    ok: true,
    token: data,
  });
});
