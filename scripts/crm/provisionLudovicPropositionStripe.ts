/**
 * Creates 2 Stripe Payment Links for /proposition/ludovic:
 *   - Formule Test    15 profils @ 1 489 €/mois (reuses comptable_acquisition_1489 price)
 *   - Formule Croissance 45 profils @ 2 500 €/mois (new price)
 *
 * Each link carries metadata:
 *   product=comptable_acquisition_1489
 *   proposition_slug=ludovic
 *   offer_id=formule-test-15 | formule-croissance-45
 *   profile_volume=15 | 45
 *
 * After running, copy the printed URLs into content/propositions/ludovic.json.
 *
 * Usage: pnpm tsx scripts/crm/provisionLudovicPropositionStripe.ts
 */

import {
  COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY,
  COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
} from "@/lib/payments/comptable-acquisition-offers";
import { getStripeClient } from "@/lib/payments/stripe";
import type Stripe from "stripe";

const LUDOVIC_CROISSANCE_LOOKUP_KEY = "ludovic_proposition_croissance_2500_monthly";
const LUDOVIC_CROISSANCE_AMOUNT_CENTS = 250_000; // 2 500 €

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findPriceByLookupKey(lookupKey: string): Promise<Stripe.Price | null> {
  const stripe = getStripeClient();
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return prices.data[0] ?? null;
}

async function findLudovicPaymentLink(offerId: string): Promise<Stripe.PaymentLink | null> {
  const stripe = getStripeClient();
  const links = await stripe.paymentLinks.list({ limit: 100, active: true });
  return (
    links.data.find(
      (link) =>
        link.metadata?.proposition_slug === "ludovic" && link.metadata?.offer_id === offerId,
    ) ?? null
  );
}

function sharedMetadata(offerId: string, profileVolume: number) {
  return {
    product: COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT,
    proposition_slug: "ludovic",
    offer_id: offerId,
    profile_volume: String(profileVolume),
  };
}

async function createLink(
  priceId: string,
  offerId: string,
  profileVolume: number,
): Promise<Stripe.PaymentLink> {
  const stripe = getStripeClient();
  const metadata = sharedMetadata(offerId, profileVolume);
  return stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: { metadata },
  });
}

// ─── Formule Test — 15 profils @ 1 489 €/mois ────────────────────────────────

async function ensureTestLink(): Promise<Stripe.PaymentLink> {
  const existing = await findLudovicPaymentLink("formule-test-15");
  if (existing?.url) {
    console.log("  [formule-test-15] Payment Link already exists.");
    return existing;
  }

  // Reuse the existing comptable_acquisition_1489 price
  const price = await findPriceByLookupKey(COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY);
  if (!price) {
    throw new Error(
      `Price not found for lookup key '${COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY}'. ` +
        "Run provisionComptableAcquisition1489Stripe.ts first.",
    );
  }

  return createLink(price.id, "formule-test-15", 15);
}

// ─── Formule Croissance — 45 profils @ 2 500 €/mois ──────────────────────────

async function ensureCroissancePrice(): Promise<Stripe.Price> {
  const existing = await findPriceByLookupKey(LUDOVIC_CROISSANCE_LOOKUP_KEY);
  if (existing) {
    console.log(`  [formule-croissance-45] Price already exists: ${existing.id}`);
    return existing;
  }

  const stripe = getStripeClient();
  const product = await stripe.products.create({
    name: "Hercule Comptable — Acquisition Ludovic Croissance 45 profils",
    description:
      "Acquisition comptable 45 profils/mois — ciblage dirigeants B2B exclusif, montée en charge progressive.",
    metadata: {
      offer_type: "comptable_acquisition",
      proposition_slug: "ludovic",
      offer_id: "formule-croissance-45",
    },
  });

  return stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: LUDOVIC_CROISSANCE_AMOUNT_CENTS,
    recurring: { interval: "month" },
    lookup_key: LUDOVIC_CROISSANCE_LOOKUP_KEY,
    transfer_lookup_key: true,
    metadata: {
      offer_type: "comptable_acquisition",
      proposition_slug: "ludovic",
      offer_id: "formule-croissance-45",
    },
  });
}

async function ensureCroissanceLink(): Promise<Stripe.PaymentLink> {
  const existing = await findLudovicPaymentLink("formule-croissance-45");
  if (existing?.url) {
    console.log("  [formule-croissance-45] Payment Link already exists.");
    return existing;
  }

  const price = await ensureCroissancePrice();
  return createLink(price.id, "formule-croissance-45", 45);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Provisioning Ludovic Proposition Stripe Payment Links…\n");

  console.log("1. Formule Test — 15 profils @ 1 489 €/mois");
  const testLink = await ensureTestLink();
  console.log(`   url=${testLink.url}\n`);

  console.log("2. Formule Croissance — 45 profils @ 2 500 €/mois");
  const croissanceLink = await ensureCroissanceLink();
  console.log(`   url=${croissanceLink.url}\n`);

  console.log("─────────────────────────────────────────────────");
  console.log("Update content/propositions/ludovic.json:");
  console.log(`  formule-test-15       → stripePaymentLinkUrl: "${testLink.url}"`);
  console.log(`  formule-croissance-45 → stripePaymentLinkUrl: "${croissanceLink.url}"`);
  console.log("─────────────────────────────────────────────────");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
