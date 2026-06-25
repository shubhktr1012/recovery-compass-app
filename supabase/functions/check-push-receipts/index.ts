/* eslint-disable import/no-unresolved */

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
const pushFunctionAdminToken = Deno.env.get("PUSH_FUNCTION_ADMIN_TOKEN")?.trim() ?? null;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables for check-push-receipts");
}

type PendingReceiptRow = {
  id: string;
  ticket_id: string;
  token_id: string | null;
};

type ExpoReceipt = {
  details?: Record<string, unknown>;
  message?: string;
  status?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
}

function isServiceAuthorized(req: Request) {
  const bearerToken = getBearerToken(req);
  if (!bearerToken) {
    return false;
  }

  if (pushFunctionAdminToken && bearerToken === pushFunctionAdminToken) {
    return true;
  }

  return bearerToken === supabaseServiceKey;
}

function getLimit(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 100;
  }

  return Math.max(1, Math.min(300, Math.trunc(value)));
}

async function disableToken(supabaseAdmin: any, tokenId: string, reason: string) {
  const { error } = await supabaseAdmin
    .from("push_device_tokens")
    .update({
      disabled_at: new Date().toISOString(),
      disabled_reason: reason,
      is_disabled: true,
    })
    .eq("id", tokenId);

  if (error) {
    console.warn("Failed to disable push token from receipt:", {
      code: error.code,
      message: error.message,
      tokenId,
    });
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!isServiceAuthorized(req)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const limit = getLimit((body as { limit?: unknown }).limit);
  const sentBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: deliveries, error: deliveryError } = await supabaseAdmin
    .from("push_notification_deliveries")
    .select("id, ticket_id, token_id")
    .eq("ticket_status", "ok")
    .not("ticket_id", "is", null)
    .is("receipt_checked_at", null)
    .lte("sent_at", sentBefore)
    .order("sent_at", { ascending: true })
    .limit(limit);

  if (deliveryError) {
    console.error("Pending push receipt lookup failed:", {
      code: deliveryError.code,
      message: deliveryError.message,
    });
    return jsonResponse({ error: "Pending push receipt lookup failed" }, 500);
  }

  const pendingRows = ((deliveries ?? []) as PendingReceiptRow[]).filter((row) => row.ticket_id);
  if (pendingRows.length === 0) {
    return jsonResponse({ ok: true, checked: 0 });
  }

  const receiptIds = pendingRows.map((row) => row.ticket_id);
  let expoResponse: Response;

  try {
    expoResponse = await fetch(EXPO_PUSH_RECEIPTS_URL, {
      body: JSON.stringify({ ids: receiptIds }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch (error) {
    console.error("Expo Push receipt API network error:", { error });
    return jsonResponse({ error: "Expo Push receipt API network error" }, 502);
  }

  const expoBody = await expoResponse.json().catch(() => ({}));
  if (!expoResponse.ok) {
    console.error("Expo Push receipt API rejected request:", {
      body: expoBody,
      status: expoResponse.status,
    });
    return jsonResponse({ error: "Expo Push receipt API rejected request" }, 502);
  }

  const receiptMap = (expoBody?.data ?? {}) as Record<string, ExpoReceipt>;
  const checkedAt = new Date().toISOString();
  let disabledCount = 0;

  await Promise.all(pendingRows.map(async (row) => {
    const receipt = receiptMap[row.ticket_id] ?? null;
    const receiptStatus = receipt?.status === "ok"
      ? "ok"
      : receipt
        ? "error"
        : "missing";
    const receiptError = typeof receipt?.details?.error === "string" ? receipt.details.error : null;

    if (receiptError === "DeviceNotRegistered" && row.token_id) {
      await disableToken(supabaseAdmin, row.token_id, "DeviceNotRegistered");
      disabledCount += 1;
    }

    await supabaseAdmin
      .from("push_notification_deliveries")
      .update({
        receipt_checked_at: checkedAt,
        receipt_details: receipt?.details ?? null,
        receipt_message: receipt?.message ?? null,
        receipt_status: receiptStatus,
      })
      .eq("id", row.id);
  }));

  return jsonResponse({
    checked: pendingRows.length,
    disabledTokens: disabledCount,
    ok: true,
  });
});
