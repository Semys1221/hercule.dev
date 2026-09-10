import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import {
  amountCentsForComptableOffer,
  priceIdForComptableOffer,
  stripeCheckoutModeForComptablePrice,
} from "@/lib/payments/comptable-offers";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import {
  getAppBaseUrl,
  getCheckoutBrandingSettings,
  getStripeClient,
} from "@/lib/payments/stripe";

const bodySchema = z.object({
  slug: z.string().min(1),
  offerType: z.enum([
    OFFER_TYPES_COMPTABLE.starter999_5,
    OFFER_TYPES_COMPTABLE.monthly1499,
    OFFER_TYPES_COMPTABLE.pack3x1499,
  ]),
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

  const { slug, offerType } = parsed.data;

  try {
    const client = createLinkTrackingClient();

    const { data: lead, error: leadError } = await client
      .from("comptable")
      .select("id, email, slug")
      .eq("slug", slug.trim())
      .maybeSingle();

    if (leadError) {
      throw new Error(leadError.message);
    }
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const stripe = getStripeClient();
    const priceId = priceIdForComptableOffer(offerType);
    const price = await stripe.prices.retrieve(priceId);
    const checkoutMode = stripeCheckoutModeForComptablePrice(price);
    const amountCents = amountCentsForComptableOffer(offerType);
    const baseUrl = getAppBaseUrl();

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6a28c9" },
      body: JSON.stringify({
        sessionId: "6a28c9",
        runId: "post-fix",
        hypothesisId: "A-B",
        location: "checkout-comptable/route.ts:priceResolved",
        message: "Stripe price resolved for comptable checkout",
        data: {
          slug,
          offerType,
          priceId,
          priceType: price.type,
          checkoutMode,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const { data: paymentRow, error: paymentError } = await client
      .from("payments")
      .insert({
        comptable_id: lead.id,
        offer_type: offerType,
        amount_cents: amountCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentError || !paymentRow) {
      throw new Error(paymentError?.message ?? "Failed to create payment row");
    }

    const metadata = {
      comptable_id: lead.id,
      payment_id: paymentRow.id,
      slug: lead.slug,
      offer_type: offerType,
    };

    const sharedSessionParams = {
      ui_mode: "embedded_page" as const,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/dashboard/${lead.slug}?paid=1`,
      customer_email: lead.email,
      branding_settings: getCheckoutBrandingSettings(),
      wallet_options: {
        link: {
          display: "never",
        },
      },
      metadata,
    };

    const session =
      checkoutMode === "subscription"
        ? await stripe.checkout.sessions.create({
            mode: "subscription",
            ...sharedSessionParams,
            subscription_data: { metadata },
          } as Stripe.Checkout.SessionCreateParams)
        : await stripe.checkout.sessions.create({
            mode: "payment",
            ...sharedSessionParams,
            invoice_creation: { enabled: true },
          } as Stripe.Checkout.SessionCreateParams);

    await client
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", paymentRow.id);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6a28c9" },
      body: JSON.stringify({
        sessionId: "6a28c9",
        runId: "post-fix",
        hypothesisId: "A-B",
        location: "checkout-comptable/route.ts:success",
        message: "Comptable checkout session created",
        data: {
          slug,
          offerType,
          checkoutMode,
          sessionId: session.id,
          hasClientSecret: Boolean(session.client_secret),
        },
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
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6a28c9" },
      body: JSON.stringify({
        sessionId: "6a28c9",
        runId: "post-fix",
        hypothesisId: "A-E",
        location: "checkout-comptable/route.ts:catch",
        message: "Comptable checkout failed",
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const { body: errorBody, status } = checkoutErrorResponse(
      error,
      "payments/checkout-comptable",
    );
    return NextResponse.json(errorBody, { status });
  }
}
