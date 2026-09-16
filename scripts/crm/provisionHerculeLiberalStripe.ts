/**
 * Creates Stripe Product "Hercule Libéral" + recurring price 1 200 €/mois + Payment Link.
 * Prints STRIPE_PRICE_HERCULE_LIBERAL_MONTHLY and STRIPE_PAYMENT_LINK_HERCULE_LIBERAL for .env / Vercel.
 *
 * Usage: tsx --env-file=.env ./scripts/crm/provisionHerculeLiberalStripe.ts
 */

import { HERCULE_LIBERAL } from "@/lib/commercial/constants";
import {
  HERCULE_LIBERAL_STRIPE_LOOKUP_KEY,
  HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
} from "@/lib/payments/hercule-liberal-offers";
import { getStripeClient } from "@/lib/payments/stripe";
import type Stripe from "stripe";

async function findExistingPrice() {
  const stripe = getStripeClient();
  const prices = await stripe.prices.list({
    lookup_keys: [HERCULE_LIBERAL_STRIPE_LOOKUP_KEY],
    active: true,
    limit: 1,
    expand: ["data.product"],
  });
  return prices.data[0] ?? null;
}

async function findExistingPaymentLink(): Promise<Stripe.PaymentLink | null> {
  const stripe = getStripeClient();
  const links = await stripe.paymentLinks.list({ limit: 100, active: true });

  for (const link of links.data) {
    if (link.metadata?.product === HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_METADATA_PRODUCT) {
      return link;
    }
  }

  return null;
}

async function createPaymentLink(priceId: string): Promise<Stripe.PaymentLink> {
  const stripe = getStripeClient();
  const metadata = {
    product: HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
    offer_type: HERCULE_LIBERAL.offerType,
  };

  return stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: { metadata },
  });
}

async function ensurePaymentLink(priceId: string): Promise<Stripe.PaymentLink> {
  const existing = await findExistingPaymentLink();
  if (existing?.url) {
    return existing;
  }
  return createPaymentLink(priceId);
}

async function main() {
  const stripe = getStripeClient();
  let price = await findExistingPrice();

  if (price) {
    console.log("Existing Hercule Libéral price found:");
    console.log(`  price_id=${price.id}`);
    console.log(`  lookup_key=${HERCULE_LIBERAL_STRIPE_LOOKUP_KEY}`);
    console.log("");
    console.log(`STRIPE_PRICE_HERCULE_LIBERAL_MONTHLY=${price.id}`);
  } else {
    const product = await stripe.products.create({
      name: HERCULE_LIBERAL.productName,
      description:
        "Accès illimité au pipeline de rendez-vous visio Hercule (cabinets comptables et conseillers financiers).",
      metadata: {
        offer_type: HERCULE_LIBERAL.offerType,
        product: HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
      },
    });

    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: HERCULE_LIBERAL.monthlyPriceCents,
      recurring: { interval: "month" },
      lookup_key: HERCULE_LIBERAL_STRIPE_LOOKUP_KEY,
      transfer_lookup_key: true,
      metadata: {
        offer_type: HERCULE_LIBERAL.offerType,
        product: HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
      },
    });

    console.log("Created Hercule Libéral Stripe catalog:");
    console.log(`  product_id=${product.id}`);
    console.log(`  price_id=${price.id}`);
    console.log(`  lookup_key=${HERCULE_LIBERAL_STRIPE_LOOKUP_KEY}`);
    console.log("");
    console.log(`STRIPE_PRICE_HERCULE_LIBERAL_MONTHLY=${price.id}`);
  }

  const paymentLink = await ensurePaymentLink(price.id);
  console.log("");
  console.log("Hercule Libéral Payment Link:");
  console.log(`  payment_link_id=${paymentLink.id}`);
  console.log(`  url=${paymentLink.url}`);
  console.log("");
  console.log(`STRIPE_PAYMENT_LINK_HERCULE_LIBERAL=${paymentLink.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
