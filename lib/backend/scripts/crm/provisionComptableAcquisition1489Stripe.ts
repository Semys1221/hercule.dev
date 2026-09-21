/**
 * Creates Stripe Product "Hercule Comptable — Acquisition 1 mois" + recurring price 1 489 €/mois + Payment Link.
 * Prints STRIPE_PRICE_COMPTABLE_ACQUISITION_1489 and STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489 for .env / Vercel.
 *
 * Usage: pnpm provision-comptable-acquisition-1489-stripe
 */

import { COMPTABLE_ACQUISITION_1489 } from "@/lib/commercial/constants";
import {
  COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY,
  COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
} from "@/lib/legacy/payments/comptable-acquisition-offers";
import { getStripeClient } from "@/lib/legacy/payments/stripe";
import type Stripe from "stripe";

async function findExistingPrice() {
  const stripe = getStripeClient();
  const prices = await stripe.prices.list({
    lookup_keys: [COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY],
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
    if (
      link.metadata?.product === COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT
    ) {
      return link;
    }
  }

  return null;
}

async function createPaymentLink(priceId: string): Promise<Stripe.PaymentLink> {
  const stripe = getStripeClient();
  const metadata = {
    product: COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
    offer_type: COMPTABLE_ACQUISITION_1489.offerType,
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
    console.log("Existing Comptable Acquisition 1 489 price found:");
    console.log(`  price_id=${price.id}`);
    console.log(`  lookup_key=${COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY}`);
    console.log("");
    console.log(`STRIPE_PRICE_COMPTABLE_ACQUISITION_1489=${price.id}`);
  } else {
    const product = await stripe.products.create({
      name: COMPTABLE_ACQUISITION_1489.productName,
      description:
        "Acquisition comptable 1 mois — 10 à 15 rendez-vous planifiés avec entrepreneurs (comptabilité, engagement 12 mois).",
      metadata: {
        offer_type: COMPTABLE_ACQUISITION_1489.offerType,
        product: COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
      },
    });

    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: COMPTABLE_ACQUISITION_1489.monthlyPriceCents,
      recurring: { interval: "month" },
      lookup_key: COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY,
      transfer_lookup_key: true,
      metadata: {
        offer_type: COMPTABLE_ACQUISITION_1489.offerType,
        product: COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
      },
    });

    console.log("Created Comptable Acquisition Stripe catalog:");
    console.log(`  product_id=${product.id}`);
    console.log(`  price_id=${price.id}`);
    console.log(`  lookup_key=${COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY}`);
    console.log("");
    console.log(`STRIPE_PRICE_COMPTABLE_ACQUISITION_1489=${price.id}`);
  }

  const paymentLink = await ensurePaymentLink(price.id);
  console.log("");
  console.log("Comptable Acquisition Payment Link:");
  console.log(`  payment_link_id=${paymentLink.id}`);
  console.log(`  url=${paymentLink.url}`);
  console.log("");
  console.log(`STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489=${paymentLink.url}`);
  console.log(
    `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489=${paymentLink.url}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
