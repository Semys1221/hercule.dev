import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  assertHerculeLiberalStripePrice,
  HERCULE_LIBERAL_OFFER_TYPE,
  priceIdForHerculeLiberal,
} from "@/lib/payments/hercule-liberal-offers";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import { buildCheckoutIntegrationIdentifier } from "@/lib/payments/agence-offers";
import {
  getAppBaseUrl,
  getCheckoutBrandingSettings,
  getStripeClient,
} from "@/lib/payments/stripe";

function pipelineUrls(baseUrl: string) {
  return {
    success: `${baseUrl}/email/agence/pipeline/merci.html`,
    cancel: `${baseUrl}/email/agence/pipeline/dashboard.html`,
  };
}

async function createHerculeLiberalCheckoutSession(): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const priceId = priceIdForHerculeLiberal();
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  assertHerculeLiberalStripePrice(price);

  const baseUrl = getAppBaseUrl();
  const { success, cancel } = pipelineUrls(baseUrl);
  const integrationSuffix = randomBytes(4).toString("hex");

  const metadata = {
    product: "hercule_liberal",
    offer_type: HERCULE_LIBERAL_OFFER_TYPE,
  };

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
    branding_settings: getCheckoutBrandingSettings(),
    wallet_options: {
      link: {
        display: "never",
      },
    },
    metadata,
    subscription_data: { metadata },
    integration_identifier: buildCheckoutIntegrationIdentifier(integrationSuffix),
  } as Stripe.Checkout.SessionCreateParams);
}

/** Redirect buyer to Stripe Checkout (Hercule Libéral — 1 200 €/mois). */
export async function GET() {
  try {
    const session = await createHerculeLiberalCheckoutSession();
    if (!session.url) {
      throw new Error("Stripe Checkout session URL missing");
    }
    return NextResponse.redirect(session.url);
  } catch (error) {
    const { body, status } = checkoutErrorResponse(
      error,
      "payments/checkout-hercule-liberal",
    );
    return NextResponse.json(body, { status });
  }
}

/** Same as GET — for programmatic clients that prefer POST. */
export async function POST() {
  try {
    const session = await createHerculeLiberalCheckoutSession();
    if (!session.url) {
      throw new Error("Stripe Checkout session URL missing");
    }
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const { body, status } = checkoutErrorResponse(
      error,
      "payments/checkout-hercule-liberal",
    );
    return NextResponse.json(body, { status });
  }
}
