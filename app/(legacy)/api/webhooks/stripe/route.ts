import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { resolveConferenceCheckoutSession } from "@/lib/legacy/payments/conference-checkout-session";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/legacy/payments/stripe";
import {
  handleConferenceCheckoutCompleted,
  handleConferenceInvoicePaid,
  handleConferenceSubscriptionDeleted,
} from "@/lib/legacy/payments/stripe-webhook-conference";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    console.error("[stripe/webhook]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const conferenceSession = await resolveConferenceCheckoutSession(
        client,
        session,
      );

      if (conferenceSession) {
        const handled = await handleConferenceCheckoutCompleted(
          client,
          conferenceSession,
          event.id,
        );
        if (handled) {
          return NextResponse.json({ ok: true, product: "conference" });
        }
      }

      console.info(
        "[stripe/webhook] checkout.session.completed ignored (non-conference)",
        session.id,
        session.metadata?.product ?? session.metadata?.offer_type ?? "—",
      );
      return NextResponse.json({ ok: true, ignored: "legacy_or_unknown_checkout" });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const conferenceHandled = await handleConferenceInvoicePaid(
        client,
        invoice,
        event.id,
      );
      if (conferenceHandled) {
        return NextResponse.json({ ok: true, handled: true, product: "conference" });
      }
      return NextResponse.json({ ok: true, ignored: "legacy_or_unknown_invoice" });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const conferenceHandled = await handleConferenceSubscriptionDeleted(
        client,
        subscription,
      );
      if (conferenceHandled) {
        return NextResponse.json({ ok: true, handled: true, product: "conference" });
      }
      return NextResponse.json({ ok: true, ignored: "legacy_or_unknown_subscription" });
    }

    return NextResponse.json({ ok: true, ignored: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    console.error("[stripe/webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
