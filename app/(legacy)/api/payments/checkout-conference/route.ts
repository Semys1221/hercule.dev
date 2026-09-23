import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import {
  CONFERENCE_CARDS,
  hasSecondaryVertical,
  offerTypeForCheckout,
  rdvCountForOffer,
  resolveConferenceClientType,
  type ConferenceBilling,
} from "@/lib/commercial/conference-pricing";
import { assertConferenceCheckoutOpen } from "@/lib/conference/sale-window-store";
import { buildCheckoutIntegrationIdentifier } from "@/lib/legacy/payments/agence-offers";
import { checkoutErrorResponse } from "@/lib/legacy/payments/checkout-errors";
import {
  amountCentsForConferenceOffer,
  priceIdForConferenceOffer,
  stripeCheckoutModeForConferencePrice,
} from "@/lib/legacy/payments/conference-offers";
import { createConferenceClientDraft } from "@/lib/legacy/payments/conference-client-draft";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import {
  getAppBaseUrl,
  getCheckoutBrandingSettings,
  getStripeClient,
} from "@/lib/legacy/payments/stripe";

const bodySchema = z.object({
  card: z.enum([CONFERENCE_CARDS.dec, CONFERENCE_CARDS.courtage]),
  billing: z.enum(["monthly", "pack"]),
  selections: z.object({
    cif: z.boolean(),
    ias: z.boolean(),
  }),
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

  const { card, billing, selections } = parsed.data;

  const clientType = resolveConferenceClientType({ card, selections });
  if (!clientType) {
    return NextResponse.json(
      { error: "Sélectionnez au moins une verticale CIF ou IAS" },
      { status: 400 },
    );
  }

  const offerType = offerTypeForCheckout(clientType, billing as ConferenceBilling);
  const rdvCount = rdvCountForOffer(offerType);
  const amountCents = amountCentsForConferenceOffer(offerType);

  try {
    const client = createLinkTrackingClient();
    try {
      await assertConferenceCheckoutOpen(client);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "ConferenceSaleClosedError" ||
          error.message === "conference_sale_window_missing")
      ) {
        return NextResponse.json(
          { error: "Le lien n'est pas actif." },
          { status: 403 },
        );
      }
      throw error;
    }
    const secondaryVertical = hasSecondaryVertical(selections) ? "ias" : null;

    const draft = await createConferenceClientDraft(client, {
      clientType,
      billing: billing as ConferenceBilling,
      offerType,
      secondaryVertical,
    });
    const { slug } = draft;

    const stripe = getStripeClient();
    const priceId = priceIdForConferenceOffer(offerType);
    const price = await stripe.prices.retrieve(priceId);
    const checkoutMode = stripeCheckoutModeForConferencePrice(price);
    const stripeAmountCents = price.unit_amount ?? 0;

    if (stripeAmountCents !== amountCents) {
      console.error(
        "[payments/checkout-conference] Unexpected Stripe price amount:",
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

    const baseUrl = getAppBaseUrl();
    const integrationSuffix = randomBytes(4).toString("hex");

    const metadata: Record<string, string> = {
      slug,
      client_id: draft.clientId,
      payment_id: draft.paymentId,
      client_type: clientType,
      offer_type: offerType,
      billing,
      rdv_count: String(rdvCount),
      source: "conference",
      selections_cif: String(selections.cif),
      selections_ias: String(selections.ias),
      ...(secondaryVertical ? { secondary_vertical: secondaryVertical } : {}),
    };

    const sharedSessionParams = {
      ui_mode: "embedded_page" as const,
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/clients/${slug}?paid=1&client_type=${clientType}&session_id={CHECKOUT_SESSION_ID}`,
      branding_settings: getCheckoutBrandingSettings(),
      wallet_options: {
        link: {
          display: "never",
        },
      },
      metadata,
      integration_identifier: buildCheckoutIntegrationIdentifier(integrationSuffix),
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

    const { error: sessionLinkError } = await client
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", draft.paymentId);

    if (sessionLinkError) {
      throw new Error(sessionLinkError.message);
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      slug,
      clientType,
    });
  } catch (error) {
    const { body: errorBody, status } = checkoutErrorResponse(
      error,
      "payments/checkout-conference",
    );
    return NextResponse.json(errorBody, { status });
  }
}
