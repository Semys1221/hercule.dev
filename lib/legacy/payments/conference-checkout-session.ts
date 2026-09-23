import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import {
  billingForConferenceOffer,
  clientTypeForConferenceOffer,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import { createConferenceClientDraft } from "@/lib/legacy/payments/conference-client-draft";
import { isConferenceOfferType } from "@/lib/legacy/payments/conference-offers";
import { isConferencePaymentLinkSession } from "@/lib/legacy/payments/conference-payment-links";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ConferencePaymentRef = { id: string; client_id: string };

async function findPaymentBySession(
  client: SupabaseClient,
  sessionId: string,
): Promise<ConferencePaymentRef | null> {
  const { data } = await client
    .from("payments")
    .select("id, client_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  return data?.client_id ? data : null;
}

async function claimReferencedPayment(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  offerType: ConferenceOfferType,
): Promise<ConferencePaymentRef | null> {
  const referenceId = session.client_reference_id?.trim();
  if (!referenceId || !UUID_PATTERN.test(referenceId)) {
    return null;
  }

  const { data: payment } = await client
    .from("payments")
    .select("id, client_id, offer_type, stripe_checkout_session_id")
    .eq("id", referenceId)
    .maybeSingle();

  if (!payment?.client_id || payment.stripe_checkout_session_id) {
    return null;
  }

  if (payment.offer_type !== offerType) {
    console.error(
      "[stripe/conference-payment-link] offer mismatch:",
      payment.id,
      payment.offer_type,
      "paid",
      offerType,
    );
  }

  const { error } = await client
    .from("payments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", payment.id);
  if (error) {
    throw new Error(error.message);
  }

  return { id: payment.id, client_id: payment.client_id };
}

async function createPaymentForDirectLink(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  offerType: ConferenceOfferType,
): Promise<ConferencePaymentRef> {
  try {
    const draft = await createConferenceClientDraft(client, {
      clientType: clientTypeForConferenceOffer(offerType),
      billing: billingForConferenceOffer(offerType),
      offerType,
      secondaryVertical: null,
      stripeCheckoutSessionId: session.id,
    });
    return { id: draft.paymentId, client_id: draft.clientId };
  } catch (error) {
    // Webhook and return redirect can race on the unique stripe_checkout_session_id.
    const existing = await findPaymentBySession(client, session.id);
    if (existing) {
      return existing;
    }
    throw error;
  }
}

/**
 * Returns the session with conference metadata (source, client_id, payment_id) —
 * native for embedded checkout, resolved from client_reference_id for Payment Links.
 * Returns null when the session is not a conference checkout.
 */
export async function resolveConferenceCheckoutSession(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<Stripe.Checkout.Session | null> {
  if (session.metadata?.source === "conference" && session.metadata?.client_id) {
    return session;
  }
  if (!isConferencePaymentLinkSession(session)) {
    return null;
  }

  const offerTypeRaw = session.metadata?.offer_type ?? "";
  if (!isConferenceOfferType(offerTypeRaw)) {
    return null;
  }
  const offerType = offerTypeRaw;

  const payment =
    (await findPaymentBySession(client, session.id)) ??
    (await claimReferencedPayment(client, session, offerType)) ??
    (await createPaymentForDirectLink(client, session, offerType));

  return {
    ...session,
    metadata: {
      ...session.metadata,
      source: "conference",
      client_id: payment.client_id,
      payment_id: payment.id,
      offer_type: offerType,
    },
  };
}
