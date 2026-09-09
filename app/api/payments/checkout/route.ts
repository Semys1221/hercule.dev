import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import { ensureSalesTestSessionLead } from "@/lib/admin/funnels/ensure-sales-test-session";
import {
  AGENCE_CHECKOUT_OFFER_TYPES,
  PAYMENT_PHASES,
} from "@/lib/commercial/constants";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  amountCentsForAgenceOffer,
  buildCheckoutIntegrationIdentifier,
  priceIdForAgenceOffer,
} from "@/lib/payments/agence-offers";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import { getAppBaseUrl, getStripeClient } from "@/lib/payments/stripe";

const bodySchema = z.object({
  slug: z.string().min(1),
  offerType: z.enum(AGENCE_CHECKOUT_OFFER_TYPES),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const slug = parsed.data.slug.trim();
    const offerType = parsed.data.offerType;
    const lookup = await ensureSalesTestSessionLead(client, slug);
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const stripe = getStripeClient();
    const priceId = priceIdForAgenceOffer(offerType, PAYMENT_PHASES.deposit);
    const amountCents = amountCentsForAgenceOffer(offerType, PAYMENT_PHASES.deposit);
    const baseUrl = getAppBaseUrl();
    const leadSlug = lookup.lead.slug;

    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const stripeAmountCents = price.unit_amount ?? amountCents;

    if (stripeAmountCents !== amountCents) {
      console.error(
        "[payments/checkout] Unexpected Stripe price amount:",
        priceId,
        stripeAmountCents,
        "expected",
        amountCents,
      );
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Invalid Stripe product configuration" },
          { status: 500 },
        );
      }
    }

    const { data: paymentRow, error: paymentError } = await client
      .from("payments")
      .insert({
        agence_id: lookup.lead.id,
        offer_type: offerType,
        amount_cents: amountCents,
        payment_phase: PAYMENT_PHASES.deposit,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentError || !paymentRow) {
      throw new Error(paymentError?.message ?? "Failed to create payment row");
    }

    const integrationSuffix = randomBytes(4).toString("hex");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/dashboard/${leadSlug}?paid=1`,
      customer_email: lookup.lead.email,
      invoice_creation: { enabled: true },
      wallet_options: {
        link: {
          display: "never",
        },
      },
      metadata: {
        agence_id: lookup.lead.id,
        payment_id: paymentRow.id,
        slug: leadSlug,
        offer_type: offerType,
        payment_phase: PAYMENT_PHASES.deposit,
      },
      integration_identifier: buildCheckoutIntegrationIdentifier(integrationSuffix),
    } as Stripe.Checkout.SessionCreateParams);

    await client
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", paymentRow.id);

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    const { body: errorBody, status } = checkoutErrorResponse(error, "payments/checkout");
    return NextResponse.json(errorBody, { status });
  }
}
