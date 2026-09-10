import { NextResponse } from "next/server";
import { z } from "zod";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  COMMERCIAL_COMPTABLE,
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
} from "@/lib/commercial/constants";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import {
  getAppBaseUrl,
  getCheckoutBrandingSettings,
  getComptableMonthlyPriceId,
  getComptablePack3PriceId,
  getComptableStarterPriceId,
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

function priceIdForOffer(offerType: OfferTypeComptable): string {
  if (offerType === OFFER_TYPES_COMPTABLE.pack3x1499) {
    return getComptablePack3PriceId();
  }
  if (offerType === OFFER_TYPES_COMPTABLE.starter999_5) {
    return getComptableStarterPriceId();
  }
  return getComptableMonthlyPriceId();
}

function amountCentsForOffer(offerType: OfferTypeComptable): number {
  if (offerType === OFFER_TYPES_COMPTABLE.pack3x1499) {
    return COMMERCIAL_COMPTABLE.pack3TotalCents;
  }
  if (offerType === OFFER_TYPES_COMPTABLE.starter999_5) {
    return COMMERCIAL_COMPTABLE.starterPriceCents;
  }
  return COMMERCIAL_COMPTABLE.growthMonthlyPriceCents;
}

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

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "569fa6",
    },
    body: JSON.stringify({
      sessionId: "569fa6",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "checkout-comptable/route.ts:POST",
      message: "checkout-comptable request received",
      data: { slug, offerType },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
    const priceId = priceIdForOffer(offerType);
    const amountCents = amountCentsForOffer(offerType);
    const baseUrl = getAppBaseUrl();

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/dashboard/${lead.slug}?paid=1`,
      customer_email: lead.email,
      branding_settings: getCheckoutBrandingSettings(),
      invoice_creation: { enabled: true },
      wallet_options: {
        link: {
          display: "never",
        },
      },
      metadata: {
        comptable_id: lead.id,
        payment_id: paymentRow.id,
        slug: lead.slug,
        offer_type: offerType,
      },
    });

    await client
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", paymentRow.id);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "569fa6",
      },
      body: JSON.stringify({
        sessionId: "569fa6",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "checkout-comptable/route.ts:success",
        message: "checkout session created",
        data: {
          slug,
          offerType,
          hasClientSecret: Boolean(session.client_secret),
          sessionId: session.id,
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
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "569fa6",
      },
      body: JSON.stringify({
        sessionId: "569fa6",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "checkout-comptable/route.ts:error",
        message: "checkout-comptable failed",
        data: {
          slug,
          offerType,
          error: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const { body, status } = checkoutErrorResponse(error, "payments/checkout-comptable");
    return NextResponse.json(body, { status });
  }
}
