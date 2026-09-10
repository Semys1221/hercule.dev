import { NextResponse } from "next/server";
import { z } from "zod";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import {
  amountCentsForComptableOffer,
  comptableCheckoutMode,
  priceIdForComptableOffer,
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
    const amountCents = amountCentsForComptableOffer(offerType);
    const checkoutMode = comptableCheckoutMode(offerType);
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

    const metadata = {
      comptable_id: lead.id,
      payment_id: paymentRow.id,
      slug: lead.slug,
      offer_type: offerType,
    };

    const session =
      checkoutMode === "subscription"
        ? await stripe.checkout.sessions.create({
            mode: "subscription",
            ui_mode: "embedded",
            line_items: [{ price: priceId, quantity: 1 }],
            return_url: `${baseUrl}/dashboard/${lead.slug}?paid=1`,
            customer_email: lead.email,
            branding_settings: getCheckoutBrandingSettings(),
            subscription_data: { metadata },
            wallet_options: {
              link: {
                display: "never",
              },
            },
            metadata,
          })
        : await stripe.checkout.sessions.create({
            mode: "payment",
            ui_mode: "embedded",
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
            metadata,
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
    const { body: errorBody, status } = checkoutErrorResponse(
      error,
      "payments/checkout-comptable",
    );
    return NextResponse.json(errorBody, { status });
  }
}
