import type Stripe from "stripe";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import { resolveConferenceCheckoutSession } from "./conference-checkout-session";
import { getStripeClient } from "./stripe";
import { handleConferenceCheckoutCompleted } from "./stripe-webhook-conference";

export type SyncConferenceCheckoutResult = {
  synced: boolean;
  reason?: "not_paid_yet" | "not_conference_checkout" | "session_not_found";
};

export async function syncConferenceCheckoutSession(
  sessionId: string,
): Promise<SyncConferenceCheckoutResult> {
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

  const client = createLinkTrackingClient();
  const conferenceSession = await resolveConferenceCheckoutSession(client, session);
  if (!conferenceSession) {
    return { synced: false, reason: "not_conference_checkout" };
  }

  const synced = await handleConferenceCheckoutCompleted(
    client,
    conferenceSession,
    `sync:${session.id}`,
  );

  return { synced };
}
