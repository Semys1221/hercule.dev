/**
 * Creates or updates Stripe Payment Links for conference offers (DEC / CIF / IAS).
 * Used by /conference/inscription (redirect with client_reference_id = payments.id).
 * Existing links keep their URL; after_completion + checkout text are re-synced.
 *
 * Usage: pnpm provision-conference-payment-links-stripe
 */

import {
  OFFER_TYPES_CONFERENCE,
  type ConferenceOfferType,
  conferenceCheckoutMode,
} from "@/lib/commercial/conference-pricing";
import { priceIdForConferenceOffer } from "@/lib/legacy/payments/conference-offers";
import {
  CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT,
  conferencePaymentLinkReturnUrl,
} from "@/lib/legacy/payments/conference-payment-links";
import { getAppBaseUrl, getStripeClient } from "@/lib/legacy/payments/stripe";
import type Stripe from "stripe";

type ConferencePaymentLinkSpec = {
  offerType: ConferenceOfferType;
  label: string;
  metadataKey: string;
  submitMessage: string;
};

const DEC_GUARANTEE = "Garantie : 10 rendez-vous qualifiés ou 1 mois de service offert.";
const COURTAGE_GUARANTEE =
  "Garantie : 25 rendez-vous qualifiés ou 3 mois de service offert.";

const CONFERENCE_PAYMENT_LINK_SPECS: ConferencePaymentLinkSpec[] = [
  {
    offerType: OFFER_TYPES_CONFERENCE.decMonthly,
    label: "DEC — 1 499 € / mois",
    metadataKey: "conference_dec_monthly",
    submitMessage: `Hercule DEC — formule 1 mois (1 499 €). ${DEC_GUARANTEE}`,
  },
  {
    offerType: OFFER_TYPES_CONFERENCE.decPack,
    label: "DEC — Pack 3 000 €",
    metadataKey: "conference_dec_pack",
    submitMessage: `Hercule DEC — pack 3 mois, paiement unique (3 000 €). ${DEC_GUARANTEE}`,
  },
  {
    offerType: OFFER_TYPES_CONFERENCE.cifMonthly,
    label: "CIF — 1 800 € / mois",
    metadataKey: "conference_cif_monthly",
    submitMessage: `Hercule Courtage — verticale CIF, abonnement mensuel (1 800 € / mois). ${COURTAGE_GUARANTEE}`,
  },
  {
    offerType: OFFER_TYPES_CONFERENCE.cifPack,
    label: "CIF — Pack 3 900 €",
    metadataKey: "conference_cif_pack",
    submitMessage: `Hercule Courtage — verticale CIF, pack 3 mois, paiement unique (3 900 €). ${COURTAGE_GUARANTEE}`,
  },
  {
    offerType: OFFER_TYPES_CONFERENCE.iasMonthly,
    label: "IAS — 1 800 € / mois",
    metadataKey: "conference_ias_monthly",
    submitMessage: `Hercule Courtage — verticale IAS, abonnement mensuel (1 800 € / mois). ${COURTAGE_GUARANTEE}`,
  },
  {
    offerType: OFFER_TYPES_CONFERENCE.iasPack,
    label: "IAS — Pack 3 900 €",
    metadataKey: "conference_ias_pack",
    submitMessage: `Hercule Courtage — verticale IAS, pack 3 mois, paiement unique (3 900 €). ${COURTAGE_GUARANTEE}`,
  },
];

async function listExistingPaymentLinks(): Promise<Stripe.PaymentLink[]> {
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

function findExistingPaymentLink(
  links: Stripe.PaymentLink[],
  metadataKey: string,
): Stripe.PaymentLink | null {
  for (const link of links) {
    if (
      link.metadata?.product === CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT &&
      link.metadata?.payment_link_key === metadataKey
    ) {
      return link;
    }
  }
  return null;
}

function presentationParams(spec: ConferencePaymentLinkSpec) {
  return {
    after_completion: {
      type: "redirect" as const,
      redirect: { url: conferencePaymentLinkReturnUrl(getAppBaseUrl()) },
    },
    custom_text: { submit: { message: spec.submitMessage } },
    ...(conferenceCheckoutMode(spec.offerType) === "payment"
      ? { invoice_creation: { enabled: true } }
      : {}),
  };
}

async function createPaymentLink(
  spec: ConferencePaymentLinkSpec,
): Promise<Stripe.PaymentLink> {
  const stripe = getStripeClient();
  const priceId = priceIdForConferenceOffer(spec.offerType);
  const mode = conferenceCheckoutMode(spec.offerType);
  const metadata = {
    product: CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT,
    payment_link_key: spec.metadataKey,
    offer_type: spec.offerType,
    source: "conference_personal_payment_link",
  };

  if (mode === "subscription") {
    return stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      ...presentationParams(spec),
    });
  }

  return stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    ...presentationParams(spec),
  });
}

async function ensurePaymentLink(
  links: Stripe.PaymentLink[],
  spec: ConferencePaymentLinkSpec,
): Promise<Stripe.PaymentLink> {
  const existing = findExistingPaymentLink(links, spec.metadataKey);
  if (existing?.url) {
    return getStripeClient().paymentLinks.update(existing.id, presentationParams(spec));
  }
  return createPaymentLink(spec);
}

async function main() {
  const existingLinks = await listExistingPaymentLinks();

  console.log(
    `Conference Payment Links (return → ${conferencePaymentLinkReturnUrl(getAppBaseUrl())}):\n`,
  );

  for (const spec of CONFERENCE_PAYMENT_LINK_SPECS) {
    const paymentLink = await ensurePaymentLink(existingLinks, spec);
    console.log(`${spec.label}`);
    console.log(`  offer_type=${spec.offerType}`);
    console.log(`  payment_link_id=${paymentLink.id}`);
    console.log(`  url=${paymentLink.url}`);
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
