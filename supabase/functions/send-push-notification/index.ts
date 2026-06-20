/* eslint-disable import/no-unresolved */

import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
const pushFunctionAdminToken = Deno.env.get("PUSH_FUNCTION_ADMIN_TOKEN")?.trim() ?? null;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables for send-push-notification");
}

const allowedEventTypes = new Set([
  "admin_test_push",
  "diet_plan_ready",
  "free_detox_daily_fallback",
  "program_reengagement_fallback",
]);

type PushRequest = {
  body?: unknown;
  data?: unknown;
  eventKey?: unknown;
  eventType?: unknown;
  title?: unknown;
  userId?: unknown;
};

type PushTokenRow = {
  expo_push_token: string;
  id: string;
  platform: string | null;
};

type InsertedDelivery = {
  deliveryId: string;
  token: PushTokenRow;
};

type ExpoTicket = {
  details?: Record<string, unknown>;
  id?: string;
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

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
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
    console.warn("Failed to disable push token:", { code: error.code, message: error.message, tokenId });
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

  let body: PushRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const userId = asTrimmedString(body.userId);
  const eventKey = asTrimmedString(body.eventKey);
  const eventType = asTrimmedString(body.eventType);
  const title = asTrimmedString(body.title);
  const messageBody = asTrimmedString(body.body);

  if (!userId || !eventKey || !eventType || !title || !messageBody) {
    return jsonResponse({ error: "userId, eventKey, eventType, title, and body are required" }, 400);
  }

  if (!allowedEventTypes.has(eventType)) {
    return jsonResponse({ error: "Unsupported push event type" }, 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("notifications_enabled, push_opt_in")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Push profile lookup failed:", {
      code: profileError.code,
      message: profileError.message,
      userId,
    });
    return jsonResponse({ error: "Profile lookup failed" }, 500);
  }

  if (!profile || (!profile.notifications_enabled && !profile.push_opt_in)) {
    return jsonResponse({
      ok: true,
      sent: 0,
      skipped: "notifications_disabled",
    });
  }

  const { data: tokens, error: tokenError } = await supabaseAdmin
    .from("push_device_tokens")
    .select("id, expo_push_token, platform")
    .eq("user_id", userId)
    .eq("is_disabled", false)
    .order("last_seen_at", { ascending: false });

  if (tokenError) {
    console.error("Push token lookup failed:", {
      code: tokenError.code,
      message: tokenError.message,
      userId,
    });
    return jsonResponse({ error: "Push token lookup failed" }, 500);
  }

  const activeTokens = (tokens ?? []) as PushTokenRow[];
  if (activeTokens.length === 0) {
    return jsonResponse({
      ok: true,
      sent: 0,
      skipped: "no_active_tokens",
    });
  }

  const insertedDeliveries: InsertedDelivery[] = [];
  let duplicateCount = 0;
  const pushData = {
    ...asObject(body.data),
    eventKey,
    eventType,
    source: "recovery_compass_server_push",
  };
  const payload = {
    body: messageBody,
    data: pushData,
    title,
  };

  for (const token of activeTokens) {
    const { data: delivery, error: insertError } = await supabaseAdmin
      .from("push_notification_deliveries")
      .insert({
        event_key: eventKey,
        event_type: eventType,
        payload,
        ticket_status: "pending",
        token_id: token.id,
        user_id: userId,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        duplicateCount += 1;
        continue;
      }

      console.error("Push delivery insert failed:", {
        code: insertError.code,
        eventKey,
        message: insertError.message,
        tokenId: token.id,
        userId,
      });
      return jsonResponse({ error: "Push delivery insert failed" }, 500);
    }

    insertedDeliveries.push({
      deliveryId: delivery.id,
      token,
    });
  }

  if (insertedDeliveries.length === 0) {
    return jsonResponse({
      ok: true,
      sent: 0,
      skipped: "duplicate_event_key",
      skippedDuplicate: duplicateCount,
    });
  }

  const messages = insertedDeliveries.map(({ token }) => ({
    body: messageBody,
    data: pushData,
    priority: "high",
    sound: "default",
    title,
    to: token.expo_push_token,
  }));

  let expoResponse: Response;
  try {
    expoResponse = await fetch(EXPO_PUSH_SEND_URL, {
      body: JSON.stringify(messages),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch (error) {
    const sentAt = new Date().toISOString();
    await Promise.all(insertedDeliveries.map(({ deliveryId }) =>
      supabaseAdmin
        .from("push_notification_deliveries")
        .update({
          sent_at: sentAt,
          ticket_message: "Expo Push API network error",
          ticket_status: "error",
        })
        .eq("id", deliveryId)
    ));

    console.error("Expo Push API network error:", { eventKey, error, userId });
    return jsonResponse({ error: "Expo Push API network error" }, 502);
  }

  const sentAt = new Date().toISOString();
  const expoBody = await expoResponse.json().catch(() => ({}));
  if (!expoResponse.ok) {
    await Promise.all(insertedDeliveries.map(({ deliveryId }) =>
      supabaseAdmin
        .from("push_notification_deliveries")
        .update({
          sent_at: sentAt,
          ticket_details: expoBody,
          ticket_message: "Expo Push API rejected the request",
          ticket_status: "error",
        })
        .eq("id", deliveryId)
    ));

    return jsonResponse({ error: "Expo Push API rejected the request", expoStatus: expoResponse.status }, 502);
  }

  const tickets = Array.isArray(expoBody?.data) ? expoBody.data as ExpoTicket[] : [];
  await Promise.all(insertedDeliveries.map(async ({ deliveryId, token }, index) => {
    const ticket = tickets[index] ?? {};
    const ticketStatus = ticket.status === "ok" ? "ok" : "error";
    const ticketError = typeof ticket.details?.error === "string" ? ticket.details.error : null;

    if (ticketError === "DeviceNotRegistered") {
      await disableToken(supabaseAdmin, token.id, "DeviceNotRegistered");
    }

    await supabaseAdmin
      .from("push_notification_deliveries")
      .update({
        sent_at: sentAt,
        ticket_details: ticket.details ?? null,
        ticket_id: ticket.id ?? null,
        ticket_message: ticket.message ?? null,
        ticket_status: ticketStatus,
      })
      .eq("id", deliveryId);
  }));

  return jsonResponse({
    ok: true,
    sent: insertedDeliveries.length,
    skippedDuplicate: duplicateCount,
  });
});
