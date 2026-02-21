import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

console.log("RevenueCat Webhook Function Started!")

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
// REVENUECAT_WEBHOOK_AUTH is a shared secret you will configure in Supabase and RevenueCat
const expectedAuthHeader = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");

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

        // Default tier is 'free'. RevenueCat will pass the entitlements array in the webhook.
        let newTier = 'free';
        let newStatus = 'inactive';

        // Evaluate the event type
        // Relevant Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, UNCANCELLATION, NON_RENEWING_PURCHASE
        if (["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"].includes(event.type)) {
            newStatus = 'active';

            // Determine the tier based on Entitlements attached to the webhook
            const entitlements = event.entitlements || [];
            const has6Day = entitlements.some((e: Record<string, unknown>) => e.id === '6_day_reset' || typeof e.product_identifier === 'string' && e.product_identifier.includes('6day'));
            const has90Day = entitlements.some((e: Record<string, unknown>) => e.id === '90_day_transform' || typeof e.product_identifier === 'string' && e.product_identifier.includes('90day'));

            if (has90Day) {
                newTier = '90-day';
            } else if (has6Day) {
                newTier = '6-day';
            } else {
                // Fallback to checking the product_id directly if entitlements array is somehow missing
                if (event.product_id?.includes('90')) newTier = '90-day';
                if (event.product_id?.includes('6')) newTier = '6-day';
            }
        } else if (["CANCELLATION", "EXPIRATION"].includes(event.type)) {
            newStatus = 'expired';
            newTier = 'free'; // Optionally keep the tier string, but status is expired
        }

        // 2. Update the Supabase Profile based on `revenuecat_app_user_id` or default `id`
        console.log(`Updating Profile: Status=${newStatus}, Tier=${newTier}`);

        // RevenueCat 'app_user_id' can be mapped to either your Supabase auth.users ID, 
        // or an anonymous anonymous ID. Ideally, your mobile app sends the Supabase user ID 
        // to RevenueCat at signup via `Purchases.logIn()`.
        const appUserId = event.app_user_id;

        // Use Postgres upsert or update to modify the profile
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_tier: newTier,
                subscription_status: newStatus
            })
            .eq('id', appUserId); // Assuming app_user_id == supabase auth unique id

        if (error) {
            console.error("Database Update Error:", error);
            // Wait, what if the user used a different ID or anonymous user? 
            // We also query against the specific revenuecat_app_user_id column we created just in case
            const { error: fallbackError } = await supabase
                .from('profiles')
                .update({
                    subscription_tier: newTier,
                    subscription_status: newStatus
                })
                .eq('revenuecat_app_user_id', appUserId);

            if (fallbackError) {
                console.error("Fallback Update Error:", fallbackError);
                throw fallbackError;
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
