import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";
import {
  getAppBaseUrl,
  getStarterOfferType,
  getStarterPriceId,
  getStripeClient,
} from "@/lib/payments/stripe";

const bodySchema = z.object({
  slug: z.string().min(1),
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
    const lookup = await findLeadByLink(client, parsed.data.slug.trim());
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const stripe = getStripeClient();
    const priceId = getStarterPriceId();
    const offerType = getStarterOfferType();
    const baseUrl = getAppBaseUrl();
    const slug = lookup.lead.slug;

    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const amountCents = price.unit_amount ?? 148900;
    const product = price.product as Stripe.Product;
    const productName = typeof product === "string" ? product : product.name;

    if (
      (typeof product !== "string" && !product.name.includes("Starter")) ||
      amountCents !== 148900
    ) {
      console.error(
        "[payments/checkout] Unexpected Stripe product:",
        productName,
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
      return_url: `${baseUrl}/dashboard/${slug}?paid=1`,
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
        slug,
        offer_type: offerType,
      },
    });

    await client
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", paymentRow.id);

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout creation failed";
    console.error("[payments/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
