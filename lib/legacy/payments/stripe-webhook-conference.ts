import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import {
  conferenceCheckoutMode,
  rdvCountForOffer,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import { findClientById } from "@/lib/clients/supabase";
import {
  notifySubscriptionCancelled,
  notifySubscriptionRenewed,
} from "@/lib/clients/workflows/subscription-notify";
import { insertCalendlySeatOnboardingForClient } from "@/lib/legacy/calendly-seat-onboarding/store";
import { scheduleConferenceEmailSequence } from "@/lib/legacy/conference/post-payment";
import { isConferenceOfferType } from "@/lib/legacy/payments/conference-offers";
import { getStripeClient } from "@/lib/legacy/payments/stripe";

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

function customerIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.customer === "string") {
    return session.customer;
  }
  return session.customer?.id ?? null;
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  }).subscription;
  if (typeof legacy === "string") {
    return legacy;
  }
  if (legacy && typeof legacy === "object" && "id" in legacy) {
    return legacy.id;
  }

  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") {
    return parentSub;
  }
  if (parentSub && typeof parentSub === "object" && "id" in parentSub) {
    return parentSub.id;
  }
  return null;
}

function emailFromSession(session: Stripe.Checkout.Session): string | null {
  const email =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    session.metadata?.email?.trim();
  return email || null;
}

export async function handleConferenceCheckoutCompleted(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<boolean> {
  const paymentId = session.metadata?.payment_id;
  const clientId = session.metadata?.client_id;
  const source = session.metadata?.source;

  if (!paymentId || !clientId || source !== "conference") {
    return false;
  }

  const offerTypeRaw = session.metadata?.offer_type ?? "";
  if (!isConferenceOfferType(offerTypeRaw)) {
    return false;
  }
  const offerType = offerTypeRaw as ConferenceOfferType;

  const { data: existingPayment } = await client
    .from("payments")
    .select("id, status, stripe_event_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (existingPayment?.stripe_event_id === stripeEventId) {
    return true;
  }

  const subscriptionId = subscriptionIdFromSession(session);
  const customerId = customerIdFromSession(session);
  const succeededAt = new Date().toISOString();
  const rdvCount = Number(session.metadata?.rdv_count ?? rdvCountForOffer(offerType));

  const { error: paymentError } = await client
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: paymentIntentIdFromSession(session),
      stripe_subscription_id: subscriptionId,
      stripe_event_id: stripeEventId,
      succeeded_at: succeededAt,
    })
    .eq("id", paymentId);

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const checkoutEmail = emailFromSession(session);
  const clientPatch: Record<string, unknown> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    rdv_total: Number.isFinite(rdvCount) ? rdvCount : rdvCountForOffer(offerType),
    rdv_used: 0,
  };

  if (checkoutEmail) {
    clientPatch.email = checkoutEmail.toLowerCase();
  }

  const { data: clientRow, error: clientError } = await client
    .from("clients")
    .update(clientPatch)
    .eq("id", clientId)
    .select("*")
    .maybeSingle();

  if (clientError || !clientRow) {
    throw new Error(clientError?.message ?? "Client update failed");
  }

  const email = String(clientRow.email ?? checkoutEmail ?? "");
  if (email) {
    try {
      await insertCalendlySeatOnboardingForClient({
        clientId: clientRow.id,
        email,
      });
    } catch (seatError) {
      const message = seatError instanceof Error ? seatError.message : String(seatError);
      if (!message.includes("duplicate") && !message.includes("23505")) {
        console.error("[stripe/webhook-conference] calendly seat insert failed:", message);
      }
    }
  }

  try {
    await scheduleConferenceEmailSequence({
      clientType: clientRow.client_type,
      slug: clientRow.slug,
      offerType,
      secondaryVertical:
        clientRow.secondary_vertical === "ias" ? "ias" : undefined,
      clientId: clientRow.id,
      recipientEmail: email,
      paymentAt: new Date(succeededAt),
      stripeCheckoutSessionId: session.id,
    });
  } catch (sequenceError) {
    console.error(
      "[stripe/webhook-conference] email sequence failed:",
      sequenceError instanceof Error ? sequenceError.message : sequenceError,
    );
  }

  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (opsEmail && email) {
    try {
      const { getResendClient } = await import("@/lib/resend");
      const { getBookingFromAddress } = await import(
        "@/lib/legacy/booking-communication/templates"
      );
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.hercule.dev"}/clients/${clientRow.slug}`;
      await getResendClient().emails.send({
        from: getBookingFromAddress(),
        to: [opsEmail],
        subject: `Paiement conférence — ${clientRow.client_type.toUpperCase()} · ${email}`,
        text: [
          "Paiement conférence confirmé.",
          "",
          `Email : ${email}`,
          `Slug : ${clientRow.slug}`,
          `Formule : ${offerType}`,
          `Dashboard : ${dashboardUrl}`,
          "",
          "Action : provisionner Calendly pour ce client.",
        ].join("\n"),
      });
    } catch (opsError) {
      console.error(
        "[stripe/webhook-conference] ops notification failed:",
        opsError instanceof Error ? opsError.message : opsError,
      );
    }
  }

  return true;
}

export async function handleConferenceInvoicePaid(
  client: SupabaseClient,
  invoice: Stripe.Invoice,
  stripeEventId: string,
): Promise<boolean> {
  if (invoice.billing_reason !== "subscription_cycle") {
    return false;
  }

  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) {
    return false;
  }

  const { data: existingRenewal } = await client
    .from("payments")
    .select("id")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  if (existingRenewal) {
    return true;
  }

  const { data: anchorPayment } = await client
    .from("payments")
    .select("client_id, offer_type")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("status", "succeeded")
    .order("succeeded_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!anchorPayment?.client_id || !isConferenceOfferType(anchorPayment.offer_type)) {
    return false;
  }

  if (conferenceCheckoutMode(anchorPayment.offer_type) !== "subscription") {
    return false;
  }

  const amountCents = invoice.amount_paid;
  if (!amountCents || amountCents <= 0) {
    return false;
  }

  const { error: insertError } = await client.from("payments").insert({
    client_id: anchorPayment.client_id,
    offer_type: anchorPayment.offer_type,
    amount_cents: amountCents,
    status: "succeeded",
    stripe_subscription_id: subscriptionId,
    stripe_event_id: stripeEventId,
    succeeded_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const rdvTotal = rdvCountForOffer(anchorPayment.offer_type as ConferenceOfferType);
  await client
    .from("clients")
    .update({ rdv_used: 0, rdv_total: rdvTotal })
    .eq("id", anchorPayment.client_id);

  const renewedClient = await findClientById(client, anchorPayment.client_id);
  if (renewedClient) {
    try {
      await notifySubscriptionRenewed({
        client: renewedClient,
        rdvTotal,
        stripeEventId,
      });
    } catch (error) {
      console.error(
        "[stripe/webhook-conference] renew notify failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return true;
}

export async function handleConferenceSubscriptionDeleted(
  client: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<boolean> {
  const clientId = subscription.metadata?.client_id;
  let resolvedClientId = clientId?.trim() || null;

  if (!resolvedClientId) {
    const { data: paymentRow } = await client
      .from("payments")
      .select("client_id")
      .eq("stripe_subscription_id", subscription.id)
      .eq("status", "succeeded")
      .limit(1)
      .maybeSingle();
    resolvedClientId = paymentRow?.client_id ?? null;
  }

  if (!resolvedClientId) {
    return false;
  }

  await client
    .from("clients")
    .update({ product_statut: "CANCELLED" })
    .eq("id", resolvedClientId);

  const cancelledClient = await findClientById(client, resolvedClientId);
  if (cancelledClient) {
    try {
      await notifySubscriptionCancelled({
        client: cancelledClient,
        subscriptionId: subscription.id,
      });
    } catch (error) {
      console.error(
        "[stripe/webhook-conference] cancel notify failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return true;
}

export async function createConferenceBillingPortalUrl(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string | null> {
  try {
    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: params.stripeCustomerId,
      return_url: params.returnUrl,
    });
    return portalSession.url;
  } catch (error) {
    console.error(
      "[stripe/webhook-conference] billing portal failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
