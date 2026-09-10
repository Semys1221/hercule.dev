import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import {
  balanceCents,
  isLegacyAgenceOfferType,
  PAYMENT_PHASES,
  totalPriceCentsForOffer,
} from "@/lib/commercial/constants";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  buildCheckoutIntegrationIdentifier,
  isAgenceCheckoutOfferType,
  priceIdForAgenceOffer,
} from "@/lib/payments/agence-offers";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import {
  getAppBaseUrl,
  getCheckoutBrandingSettings,
  getStripeClient,
} from "@/lib/payments/stripe";
import { loadDeliveryContext } from "@/lib/dashboard/load-delivery-context";

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
    const slug = parsed.data.slug.trim();

    const { data: lead, error: leadError } = await client
      .from("agence")
      .select("id, email, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (leadError) {
      throw new Error(leadError.message);
    }
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { data: depositPayment, error: depositError } = await client
      .from("payments")
      .select("id, offer_type, status, payment_phase")
      .eq("agence_id", lead.id)
      .eq("payment_phase", PAYMENT_PHASES.deposit)
      .eq("status", "succeeded")
      .order("succeeded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (depositError) {
      throw new Error(depositError.message);
    }
    if (!depositPayment) {
      return NextResponse.json({ error: "Acompte non réglé" }, { status: 403 });
    }

    const offerType = depositPayment.offer_type as string;
    if (isLegacyAgenceOfferType(offerType) || !isAgenceCheckoutOfferType(offerType)) {
      return NextResponse.json({ error: "Solde non applicable" }, { status: 403 });
    }

    const { data: existingBalance } = await client
      .from("payments")
      .select("id, status")
      .eq("agence_id", lead.id)
      .eq("payment_phase", PAYMENT_PHASES.balance)
      .eq("status", "succeeded")
      .limit(1)
      .maybeSingle();

    if (existingBalance) {
      return NextResponse.json({ error: "Solde déjà réglé" }, { status: 409 });
    }

    const { deliveryPlan } = await loadDeliveryContext(client, lead.id, true);
    if (
      !deliveryPlan ||
      deliveryPlan.attributionsUsed < deliveryPlan.attributionsTotal
    ) {
      return NextResponse.json(
        { error: "Livraison des contrats incomplète" },
        { status: 403 },
      );
    }

    const amountCents = balanceCents(totalPriceCentsForOffer(offerType));
    const priceId = priceIdForAgenceOffer(offerType, PAYMENT_PHASES.balance);
    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl();

    const { data: paymentRow, error: paymentError } = await client
      .from("payments")
      .insert({
        agence_id: lead.id,
        offer_type: offerType,
        amount_cents: amountCents,
        payment_phase: PAYMENT_PHASES.balance,
        parent_payment_id: depositPayment.id,
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
      return_url: `${baseUrl}/dashboard/${lead.slug}?balance_paid=1`,
      customer_email: lead.email,
      branding_settings: getCheckoutBrandingSettings(),
      invoice_creation: { enabled: true },
      wallet_options: {
        link: {
          display: "never",
        },
      },
      metadata: {
        agence_id: lead.id,
        payment_id: paymentRow.id,
        slug: lead.slug,
        offer_type: offerType,
        payment_phase: PAYMENT_PHASES.balance,
        parent_payment_id: depositPayment.id,
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
    const { body: errorBody, status } = checkoutErrorResponse(
      error,
      "payments/checkout-balance",
    );
    return NextResponse.json(errorBody, { status });
  }
}
