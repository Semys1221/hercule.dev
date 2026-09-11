import type Stripe from "stripe";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

import { getStripeClient } from "./stripe";
import { handleComptableCheckoutCompleted } from "./stripe-webhook-comptable";

export type SyncComptableCheckoutResult = {
  synced: boolean;
  reason?: "not_paid_yet" | "not_comptable_checkout" | "session_not_found";
  dashboardMode?: string;
};

export async function syncComptableCheckoutSession(
  sessionId: string,
): Promise<SyncComptableCheckoutResult> {
  const stripe = getStripeClient();
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { synced: false, reason: "session_not_found" };
  }

  if (session.status !== "complete" && session.payment_status !== "paid") {
    return { synced: false, reason: "not_paid_yet" };
  }

  if (!session.metadata?.comptable_id && !session.metadata?.entreprise_id && !session.metadata?.cif_id) {
    return { synced: false, reason: "not_comptable_checkout" };
  }

  const client = createLinkTrackingClient();
  const synced = await handleComptableCheckoutCompleted(
    client,
    session,
    `sync:${session.id}`,
  );

  return { synced };
}
