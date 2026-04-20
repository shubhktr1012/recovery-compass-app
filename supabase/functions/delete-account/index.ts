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

async function safeDeleteBy(
  supabaseAdmin: any,
  table: string,
  column: string,
  value: string,
) {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq(column, value);

  if (error) {
    // If the table doesn't exist in a given environment, treat it as a no-op.
    // (PostgREST uses code like PGRST205 for missing relations.)
    if (typeof (error as any)?.code === "string" && (error as any).code === "PGRST205") {
      return;
    }

    throw new Error(`${table} delete failed: ${error.message}`);
  }
}

async function safeUpdateNullUserId(
  supabaseAdmin: any,
  table: string,
  column: string,
  userId: string,
) {
  const { error } = await supabaseAdmin
    .from(table)
    .update({ [column]: null })
    .eq(column, userId);

  if (error) {
    if (typeof (error as any)?.code === "string" && (error as any).code === "PGRST205") {
      return;
    }

    throw new Error(`${table} update failed: ${error.message}`);
  }
}

async function enforceRateLimit(
  supabaseAdmin: any,
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

    const result = (Array.isArray(data) ? data[0] : data) as
      | { allowed?: boolean; reset_at?: string }
      | null
      | undefined;
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

  // Delete-account should be resilient even if auth-side cascades fail.
  // We explicitly purge user-owned rows in public schema using service_role,
  // then delete the auth user as the final step.
  try {
    // Keep commerce history but de-identify.
    await safeUpdateNullUserId(supabaseAdmin, "transactions", "user_id", user.id);

    // Children first where FKs exist.
    await safeDeleteBy(supabaseAdmin, "notification_logs", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "smart_notification_queue", "user_id", user.id);

    await safeDeleteBy(supabaseAdmin, "routine_checkins", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "user_routines", "user_id", user.id);

    await safeDeleteBy(supabaseAdmin, "sos_events", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "relapse_logs", "user_id", user.id);

    await safeDeleteBy(supabaseAdmin, "program_reflections", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "journal_entries", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "onboarding_responses", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "questionnaire_runs", "user_id", user.id);

    await safeDeleteBy(supabaseAdmin, "program_progress", "user_id", user.id);
    await safeDeleteBy(supabaseAdmin, "program_access", "user_id", user.id);

    await safeDeleteBy(supabaseAdmin, "profiles", "id", user.id);
  } catch (cleanupError) {
    console.error("Delete account cleanup error:", cleanupError);
    return jsonResponse({ error: "Database error deleting user" }, 500);
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Delete account admin error:", deleteError);
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ success: true });
});
