import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { getStripeClient } from "@/lib/payments/stripe";

import { getAgenceIdBySlug } from "./supabase-assertions";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

/**
 * E2E fallback when `stripe listen` is unavailable: retrieve the completed Checkout
 * Session from Stripe and apply the same DB side effects as the webhook.
 */
export async function syncStripeCheckoutPayment(slug: string): Promise<void> {
  const client = createLinkTrackingClient();
  const agenceId = await getAgenceIdBySlug(slug);

  const { data: payment, error } = await client
    .from("payments")
    .select("id, status, stripe_checkout_session_id")
    .eq("agence_id", agenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !payment?.stripe_checkout_session_id) {
    throw new Error(`payment row missing checkout session for ${slug}`);
  }

  if (payment.status === "succeeded") {
    return;
  }

  const stripe = getStripeClient();
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>> | null = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      session = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);
      break;
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : String(syncError);
      if (!message.includes("No such checkout.session") || attempt === 9) {
        throw syncError;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!session) {
    throw new Error(`unable to retrieve checkout session ${payment.stripe_checkout_session_id}`);
  }

  if (session.status !== "complete" && session.payment_status !== "paid") {
    throw new Error(
      `checkout session not paid yet (${session.status ?? "unknown"}/${session.payment_status ?? "unknown"})`,
    );
  }

  const succeededAt = new Date().toISOString();
  await client
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripe_event_id: `e2e-sync:${session.id}`,
      succeeded_at: succeededAt,
    })
    .eq("id", payment.id);

  await client
    .from("agence")
    .update({ product_statut: "PAID_PENDING_ONBOARDING" })
    .eq("id", agenceId);

  await client
    .from("sales_calls")
    .update({ status: "paid" })
    .eq("agence_id", agenceId)
    .in("status", ["scheduled", "not_paid", "completed", "no_show"]);
}

export async function sendWelcomeEmailForE2e(
  slug: string,
  request?: { post: (url: string, options?: { data?: unknown }) => Promise<{ ok: () => boolean; status: () => number; text: () => Promise<string> }> },
): Promise<void> {
  if (request) {
    const response = await request.post(`/api/admin/clients/agence/${slug}/email`, {
      data: { emailType: "product_payment_welcome" },
    });
    if (!response.ok()) {
      throw new Error(`welcome email failed: ${response.status()} ${await response.text()}`);
    }
    return;
  }

  const response = await fetch(`${BASE_URL}/api/admin/clients/agence/${slug}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailType: "product_payment_welcome" }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`welcome email failed: ${response.status} ${body}`);
  }
}
