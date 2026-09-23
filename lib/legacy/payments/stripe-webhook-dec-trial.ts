import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import { isDecFreeTrialCheckoutMetadata } from "@/lib/clients/dec-free-trial";
import { insertCalendlySeatOnboardingForClient } from "@/lib/(resend)/calendly-seat/client-store";
import { startFreeTrialStartedSequenceForClient } from "@/lib/legacy/free-trial-started-sequence/orchestrator";

function subscriptionIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.subscription === "string") {
    return session.subscription;
  }
  return session.subscription?.id ?? null;
}

function customerIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.customer === "string") {
    return session.customer;
  }
  return session.customer?.id ?? null;
}

function emailFromSession(session: Stripe.Checkout.Session): string | null {
  const email =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    session.metadata?.email?.trim();
  return email || null;
}

export async function handleDecFreeTrialCheckoutCompleted(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<boolean> {
  if (!isDecFreeTrialCheckoutMetadata(session.metadata)) {
    return false;
  }

  const paymentId = session.metadata?.payment_id;
  const clientId = session.metadata?.client_id;
  const offerType = session.metadata?.offer_type;

  if (!paymentId || !clientId || offerType !== OFFER_TYPES_COMPTABLE.monthly1499Trial) {
    return false;
  }

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

  const { error: paymentError } = await client
    .from("payments")
    .update({
      status: "succeeded",
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
  };

  if (checkoutEmail) {
    clientPatch.email = checkoutEmail.toLowerCase();
  }

  const { data: clientRow, error: clientError } = await client
    .from("clients")
    .update(clientPatch)
    .eq("id", clientId)
    .select("id, slug, email, first_name")
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
        console.error("[stripe/webhook-dec-trial] calendly seat insert failed:", message);
      }
    }
  }

  try {
    await startFreeTrialStartedSequenceForClient({
      clientId: clientRow.id,
      slug: clientRow.slug,
      email,
      firstName: clientRow.first_name,
      paymentAt: new Date(succeededAt),
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
    });
  } catch (sequenceError) {
    console.error(
      "[stripe/webhook-dec-trial] free-trial-started sequence failed:",
      sequenceError instanceof Error ? sequenceError.message : sequenceError,
    );
  }

  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (opsEmail && email) {
    try {
      const { getResendClient } = await import("@/lib/(resend)/client");
      const { getBookingFromAddress } = await import(
        "@/lib/legacy/booking-communication/templates"
      );
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.hercule.dev"}/clients/${clientRow.slug}`;
      await getResendClient().emails.send({
        from: getBookingFromAddress(),
        to: [opsEmail],
        subject: `Essai DEC démarré — ${email}`,
        text: [
          "Checkout essai DEC 14 jours confirmé.",
          "",
          `Email : ${email}`,
          `Slug : ${clientRow.slug}`,
          `Dashboard : ${dashboardUrl}`,
          "",
          "Action : provisionner Calendly pour ce client.",
        ].join("\n"),
      });
    } catch (opsError) {
      console.error(
        "[stripe/webhook-dec-trial] ops notification failed:",
        opsError instanceof Error ? opsError.message : opsError,
      );
    }
  }

  return true;
}
