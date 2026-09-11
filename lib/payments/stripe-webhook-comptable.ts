import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { revalidateBookingsCache } from "@/lib/calendly/bookings-cache";
import {
  insertJob,
  markJobFailed,
  markJobSent,
} from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import { defaultUseHtml } from "@/lib/booking-communication/signatures";
import {
  renderCustomBookingEmail,
  resolveBookingEmailTemplate,
} from "@/lib/booking-communication/template-store";
import { prepareThreadedSend } from "@/lib/booking-communication/threaded-send";
import { buildDashboardUrl } from "@/lib/link-tracking/urls";
import { isComptableSubscriptionOffer } from "@/lib/payments/comptable-offers";
import type { OfferTypeComptable } from "@/lib/commercial/constants";

type ComptableOwner = "comptable" | "entreprise" | "cif";

function ownerTable(owner: ComptableOwner): "comptable" | "entreprise" | "cif" {
  return owner;
}

function templateCategory(owner: ComptableOwner): "comptable" | "entreprise" | "cif" {
  if (owner === "cif") return "cif";
  return owner === "comptable" ? "comptable" : "entreprise";
}

async function sendComptableWelcomeEmail(
  client: SupabaseClient,
  owner: ComptableOwner,
  leadId: string,
): Promise<void> {
  const table = ownerTable(owner);
  const category = templateCategory(owner);

  const { data: lead } = await client
    .from(table)
    .select("id, email, first_name, company, slug")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return;
  }

  const emailType = "product_payment_welcome" as const;
  const idempotencyKey = `payment:welcome:${category}:${leadId}`;
  const dashboardLink = buildDashboardUrl(lead.slug);

  const template = await resolveBookingEmailTemplate({
    category,
    emailType,
  });

  const rendered = await renderCustomBookingEmail({
    subject: template.subject,
    body: template.body,
    category,
    emailType,
    firstName: lead.first_name,
    scheduledAt: null,
    confirmUrl: "",
    dashboardLink,
    company: lead.company,
    email: lead.email,
    useHtml: defaultUseHtml(emailType),
  });

  const now = new Date();
  const job = await insertJob({
    category,
    leadId: lead.id,
    emailType,
    scheduledFor: now,
    triggeredBy: "stripe_payment",
    idempotencyKey,
    useHtml: defaultUseHtml(emailType),
  });

  const threaded = await prepareThreadedSend(
    { email_type: emailType, lead_id: lead.id },
    rendered,
  );

  const sendResult = await sendBookingEmail({
    to: lead.email,
    subject: threaded.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey,
    headers: threaded.headers,
  });

  if (sendResult.ok && job) {
    await markJobSent(job.id, sendResult.id, {
      messageId: sendResult.messageId,
      threadSubject: threaded.threadSubject,
    });
  } else if (!sendResult.ok && job) {
    await markJobFailed(job.id, sendResult.error);
  }

  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (opsEmail) {
    try {
      const { getResendClient } = await import("@/lib/resend");
      const { getBookingFromAddress } = await import(
        "@/lib/booking-communication/templates"
      );
      await getResendClient().emails.send({
        from: getBookingFromAddress(),
        to: [opsEmail],
        subject: `Paiement reçu (comptable) — ${lead.company ?? lead.email}`,
        text: `Paiement confirmé pour ${lead.email} (${lead.company ?? "—"})\nDashboard: ${dashboardLink}\n\nAction requise : provisionner Calendly Pro + Zoom Pro pour ce cabinet.`,
      });
    } catch (opsError) {
      console.error(
        "[stripe/webhook] ops comptable notification failed:",
        opsError instanceof Error ? opsError.message : opsError,
      );
    }
  }
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

export async function handleComptableCheckoutCompleted(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<boolean> {
  const paymentId = session.metadata?.payment_id;
  const comptableId = session.metadata?.comptable_id;
  const entrepriseId = session.metadata?.entreprise_id;
  const cifId = session.metadata?.cif_id;

  if (!paymentId || (!comptableId && !entrepriseId && !cifId)) {
    return false;
  }

  const owner: ComptableOwner = cifId ? "cif" : comptableId ? "comptable" : "entreprise";
  const leadId = cifId ?? comptableId ?? entrepriseId!;

  const { data: existingPayment } = await client
    .from("payments")
    .select("id, status, stripe_event_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (existingPayment?.stripe_event_id === stripeEventId) {
    return true;
  }

  const subscriptionId = subscriptionIdFromSession(session);
  const succeededAt = new Date().toISOString();

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

  revalidateBookingsCache();

  const salesCallOwnerColumn =
    owner === "cif" ? "cif_id" : owner === "comptable" ? "comptable_id" : "entreprise_id";
  await client
    .from("sales_calls")
    .update({ status: "paid" })
    .eq(salesCallOwnerColumn, leadId)
    .in("status", ["scheduled", "not_paid", "completed", "no_show"]);

  try {
    await sendComptableWelcomeEmail(client, owner, leadId);
  } catch (emailError) {
    console.error(
      "[stripe/webhook] comptable payment welcome email failed:",
      emailError instanceof Error ? emailError.message : emailError,
    );
  }

  return true;
}

export async function handleComptableInvoicePaid(
  client: SupabaseClient,
  invoice: Stripe.Invoice,
  stripeEventId: string,
): Promise<boolean> {
  if (invoice.billing_reason !== "subscription_cycle") {
    return false;
  }

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

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
    .select("comptable_id, entreprise_id, cif_id, offer_type")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("status", "succeeded")
    .order("succeeded_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!anchorPayment?.comptable_id && !anchorPayment?.entreprise_id && !anchorPayment?.cif_id) {
    return false;
  }

  const amountCents = invoice.amount_paid;
  if (!amountCents || amountCents <= 0) {
    return false;
  }

  const offerType = anchorPayment.offer_type as OfferTypeComptable;
  if (!isComptableSubscriptionOffer(offerType)) {
    return false;
  }

  const insertRow: Record<string, unknown> = {
    offer_type: offerType,
    amount_cents: amountCents,
    status: "succeeded",
    stripe_subscription_id: subscriptionId,
    stripe_event_id: stripeEventId,
    succeeded_at: new Date().toISOString(),
  };

  if (anchorPayment.cif_id) {
    insertRow.cif_id = anchorPayment.cif_id;
  } else if (anchorPayment.comptable_id) {
    insertRow.comptable_id = anchorPayment.comptable_id;
  } else {
    insertRow.entreprise_id = anchorPayment.entreprise_id;
  }

  const { error: insertError } = await client.from("payments").insert(insertRow);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return true;
}

export async function handleComptableSubscriptionDeleted(
  client: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<boolean> {
  const subscriptionId = subscription.id;
  const comptableId = subscription.metadata?.comptable_id;
  const entrepriseId = subscription.metadata?.entreprise_id;
  const cifId = subscription.metadata?.cif_id;

  if (!comptableId && !entrepriseId && !cifId) {
    const { data: anchorPayment } = await client
      .from("payments")
      .select("comptable_id, entreprise_id, cif_id")
      .eq("stripe_subscription_id", subscriptionId)
      .limit(1)
      .maybeSingle();

    if (!anchorPayment?.comptable_id && !anchorPayment?.entreprise_id && !anchorPayment?.cif_id) {
      return false;
    }

    if (anchorPayment.cif_id) {
      await client
        .from("cif")
        .update({ product_statut: "CANCELLED" })
        .eq("id", anchorPayment.cif_id);
    } else if (anchorPayment.comptable_id) {
      await client
        .from("comptable")
        .update({ product_statut: "CANCELLED" })
        .eq("id", anchorPayment.comptable_id);
    } else if (anchorPayment.entreprise_id) {
      await client
        .from("entreprise")
        .update({ product_statut: "CANCELLED" })
        .eq("id", anchorPayment.entreprise_id);
    }

    return true;
  }

  if (cifId) {
    await client
      .from("cif")
      .update({ product_statut: "CANCELLED" })
      .eq("id", cifId);
  } else if (comptableId) {
    await client
      .from("comptable")
      .update({ product_statut: "CANCELLED" })
      .eq("id", comptableId);
  } else if (entrepriseId) {
    await client
      .from("entreprise")
      .update({ product_statut: "CANCELLED" })
      .eq("id", entrepriseId);
  }

  return true;
}
