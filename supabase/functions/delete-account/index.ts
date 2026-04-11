// eslint-disable-next-line import/no-unresolved -- resolved via supabase/functions/deno.json import map
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables for delete-account");
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

async function enforceRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  bucket: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
) {
  try {
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
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
    console.error("Delete account rate limit check failed:", error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

serve(async (req: Request) => {
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
    console.error("Delete account auth error:", userError);
    return jsonResponse({ error: userError?.message ?? "Unauthorized" }, 401);
  }

  const rateLimit = await enforceRateLimit(
    supabaseAdmin,
    "delete-account:user",
    user.id,
    3,
    60 * 60,
  );

  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        error: "Too many delete-account attempts. Please try again later.",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      429,
    );
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Delete account admin error:", deleteError);
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ success: true });
});
