import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { revalidateBookingsCache } from "@/lib/calendly/bookings-cache";
import { ensureComptableAcquisitionLead } from "@/lib/comptable-acquisition/provision-lead";
import { startComptableAcquisitionSequence } from "@/lib/comptable-acquisition-sequence/orchestrator";
import {
  amountCentsForComptableAcquisition1489,
  COMPTABLE_ACQUISITION_OFFER_TYPE,
  COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
} from "@/lib/payments/comptable-acquisition-offers";
import { getBookingFromAddress } from "@/lib/booking-communication/templates";
import { buildDashboardUrl } from "@/lib/link-tracking/urls";
import { getResendClient } from "@/lib/resend";

function productFromSession(session: Stripe.Checkout.Session): string | null {
  const fromSession = session.metadata?.product?.trim();
  if (fromSession) {
    return fromSession;
  }
  return null;
}

export function isComptableAcquisitionCheckoutSession(
  session: Stripe.Checkout.Session,
): boolean {
  return productFromSession(session) === COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT;
}

function subscriptionIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.subscription === "string") {
    return session.subscription;
  }
  return session.subscription?.id ?? null;
}

function paymentIntentIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }
  return session.payment_intent?.id ?? null;
}

function customerEmailFromSession(session: Stripe.Checkout.Session): string | null {
  return (
    session.customer_details?.email?.trim().toLowerCase() ||
    session.customer_email?.trim().toLowerCase() ||
    null
  );
}

export async function handleComptableAcquisitionCheckoutCompleted(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<boolean> {
  if (!isComptableAcquisitionCheckoutSession(session)) {
    return false;
  }

  const email = customerEmailFromSession(session);
  if (!email) {
    console.error("[stripe/webhook] comptable acquisition: missing customer email");
    return true;
  }

  const { data: existingBySession } = await client
    .from("payments")
    .select("id, stripe_event_id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingBySession?.stripe_event_id === stripeEventId) {
    return true;
  }

  if (existingBySession) {
    return true;
  }

  const customerName = session.customer_details?.name?.trim() ?? "";
  const firstName = customerName.split(/\s+/)[0] || null;

  const { lead, created } = await ensureComptableAcquisitionLead({
    email,
    firstName,
  });

  const succeededAt = new Date().toISOString();
  const amountCents = session.amount_total ?? amountCentsForComptableAcquisition1489();

  const { error: paymentError } = await client.from("payments").insert({
    comptable_id: lead.id,
    offer_type: COMPTABLE_ACQUISITION_OFFER_TYPE,
    amount_cents: amountCents,
    status: "succeeded",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentIdFromSession(session),
    stripe_subscription_id: subscriptionIdFromSession(session),
    stripe_event_id: stripeEventId,
    succeeded_at: succeededAt,
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  revalidateBookingsCache();

  try {
    await startComptableAcquisitionSequence({
      leadId: lead.id,
      paymentAt: new Date(succeededAt),
      stripeCheckoutSessionId: session.id,
    });
  } catch (sequenceError) {
    console.error(
      "[stripe/webhook] comptable acquisition email sequence failed:",
      sequenceError instanceof Error ? sequenceError.message : sequenceError,
    );
  }

  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (opsEmail) {
    try {
      const dashboardLink = buildDashboardUrl(lead.slug);
      await getResendClient().emails.send({
        from: getBookingFromAddress(),
        to: [opsEmail],
        subject: `Paiement acquisition comptable — ${lead.company ?? email}`,
        text: [
          `Paiement acquisition 1 489 € confirmé.`,
          `Client : ${email}${created ? " (nouveau lead)" : " (lead existant)"}`,
          `Checkout session : ${session.id}`,
          `Dashboard : ${dashboardLink}`,
          "",
          "Action requise : provisionner Calendly Pro + Zoom Pro pour ce cabinet.",
        ].join("\n"),
      });
    } catch (opsError) {
      console.error(
        "[stripe/webhook] comptable acquisition ops notification failed:",
        opsError instanceof Error ? opsError.message : opsError,
      );
    }
  }

  return true;
}
