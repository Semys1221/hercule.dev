/**
 * Deactivates all active Stripe Payment Links except the 6 conference_personal links.
 *
 * Usage: pnpm deactivate-non-conference-payment-links-stripe
 */

import { CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT } from "@/lib/legacy/payments/conference-payment-links";
import { getStripeClient } from "@/lib/legacy/payments/stripe";
import type Stripe from "stripe";

const CONFERENCE_PAYMENT_LINK_KEYS = new Set([
  "conference_dec_monthly",
  "conference_dec_pack",
  "conference_cif_monthly",
  "conference_cif_pack",
  "conference_ias_monthly",
  "conference_ias_pack",
]);

function isConferencePaymentLink(link: Stripe.PaymentLink): boolean {
  return (
    link.metadata?.product === CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT &&
    typeof link.metadata?.payment_link_key === "string" &&
    CONFERENCE_PAYMENT_LINK_KEYS.has(link.metadata.payment_link_key)
  );
}

async function listAllActivePaymentLinks(): Promise<Stripe.PaymentLink[]> {
  const stripe = getStripeClient();
  const links: Stripe.PaymentLink[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.paymentLinks.list({
      limit: 100,
      active: true,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    links.push(...page.data);
    if (!page.has_more || page.data.length === 0) {
      break;
    }
    startingAfter = page.data.at(-1)?.id;
  }

  return links;
}

async function main() {
  const links = await listAllActivePaymentLinks();
  const stripe = getStripeClient();
  const kept: Stripe.PaymentLink[] = [];
  const deactivated: Stripe.PaymentLink[] = [];

  for (const link of links) {
    if (isConferencePaymentLink(link)) {
      kept.push(link);
      continue;
    }
    await stripe.paymentLinks.update(link.id, { active: false });
    deactivated.push(link);
  }

  console.log(`Active payment links kept (${kept.length}):`);
  for (const link of kept) {
    console.log(`  ${link.metadata?.payment_link_key ?? link.id} → ${link.url}`);
  }

  console.log("");
  console.log(`Deactivated (${deactivated.length}):`);
  for (const link of deactivated) {
    console.log(`  ${link.id} → ${link.url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
