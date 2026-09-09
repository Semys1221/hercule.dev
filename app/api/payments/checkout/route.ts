import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import { ensureSalesTestSessionLead } from "@/lib/admin/funnels/ensure-sales-test-session";
import { AGENCE_CHECKOUT_OFFER_TYPES } from "@/lib/commercial/constants";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  amountCentsForAgenceOffer,
  buildCheckoutIntegrationIdentifier,
  lineItemsForAgenceCheckout,
  paymentPhaseForAgenceCheckout,
} from "@/lib/payments/agence-offers";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import { getAppBaseUrl, getStripeClient } from "@/lib/payments/stripe";

const bodySchema = z.object({
  slug: z.string().min(1),
  offerType: z.enum(AGENCE_CHECKOUT_OFFER_TYPES),
  fast: z.boolean().optional().default(false),
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
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3adecb" },
      body: JSON.stringify({
        sessionId: "3adecb",
        runId: "pre-fix",
        hypothesisId: "A-D",
        location: "checkout/route.ts:lookup",
        message: "Lead lookup result",
        data: {
          slug,
          offerType,
          found: Boolean(lookup),
          category: lookup?.category ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const stripe = getStripeClient();
    const fast = parsed.data.fast;
    const paymentPhase = paymentPhaseForAgenceCheckout(fast);
    const lineItems = lineItemsForAgenceCheckout(offerType, fast);
    const amountCents = amountCentsForAgenceOffer(offerType, paymentPhase);
    const baseUrl = getAppBaseUrl();
    const leadSlug = lookup.lead.slug;

    let stripeAmountCents = 0;
    for (const item of lineItems) {
      const price = await stripe.prices.retrieve(item.price, { expand: ["product"] });
      stripeAmountCents += (price.unit_amount ?? 0) * item.quantity;
    }

    if (stripeAmountCents !== amountCents) {
      console.error(
        "[payments/checkout] Unexpected Stripe price amount:",
        lineItems,
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
        payment_phase: paymentPhase,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentError || !paymentRow) {
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3adecb" },
        body: JSON.stringify({
          sessionId: "3adecb",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "checkout/route.ts:paymentInsert",
          message: "Payment row insert failed",
          data: { error: paymentError?.message ?? "missing row" },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw new Error(paymentError?.message ?? "Failed to create payment row");
    }

    const integrationSuffix = randomBytes(4).toString("hex");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: lineItems,
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
        payment_phase: paymentPhase,
        fast_delivery: fast ? "true" : "false",
      },
      integration_identifier: buildCheckoutIntegrationIdentifier(integrationSuffix),
    } as Stripe.Checkout.SessionCreateParams);

    await client
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", paymentRow.id);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3adecb" },
      body: JSON.stringify({
        sessionId: "3adecb",
        runId: "pre-fix",
        hypothesisId: "C-E",
        location: "checkout/route.ts:success",
        message: "Checkout session created",
        data: { sessionId: session.id, hasClientSecret: Boolean(session.client_secret) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3adecb" },
      body: JSON.stringify({
        sessionId: "3adecb",
        runId: "pre-fix",
        hypothesisId: "A-E",
        location: "checkout/route.ts:catch",
        message: "Checkout failed",
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const { body: errorBody, status } = checkoutErrorResponse(error, "payments/checkout");
    return NextResponse.json(errorBody, { status });
  }
}
