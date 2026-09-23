import type Stripe from "stripe";

import {
  OFFER_TYPES_CONFERENCE,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";

/** Stripe Payment Link metadata.product — copied onto the checkout session by Stripe. */
export const CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT = "conference_personal";

/** Live Payment Links (provisioned via provisionConferencePaymentLinksStripe.ts). */
export const CONFERENCE_PAYMENT_LINK_URLS: Record<ConferenceOfferType, string> = {
  [OFFER_TYPES_CONFERENCE.decMonthly]: "https://buy.stripe.com/9B6aEW0G91mR4DdgAE3Je0o",
  [OFFER_TYPES_CONFERENCE.decPack]: "https://buy.stripe.com/eVq4gy74x4z39Xxacg3Je0p",
  [OFFER_TYPES_CONFERENCE.cifMonthly]: "https://buy.stripe.com/14A3cubkN3uZ3z9fwA3Je0q",
  [OFFER_TYPES_CONFERENCE.cifPack]: "https://buy.stripe.com/6oUbJ09cF4z3edNcko3Je0r",
  [OFFER_TYPES_CONFERENCE.iasMonthly]: "https://buy.stripe.com/00w8wObkNc1v7Ppbgk3Je0s",
  [OFFER_TYPES_CONFERENCE.iasPack]: "https://buy.stripe.com/00w7sKewZaXr9Xxesw3Je0t",
};

/**
 * `client_reference_id` must be alphanumeric, dashes or underscores (max 200 chars) —
 * a payments.id UUID fits.
 */
export function paymentLinkUrlForConferenceOffer(
  offerType: ConferenceOfferType,
  clientReferenceId: string,
): string {
  const url = new URL(CONFERENCE_PAYMENT_LINK_URLS[offerType]);
  url.searchParams.set("client_reference_id", clientReferenceId);
  return url.toString();
}

export function conferencePaymentLinkReturnUrl(baseUrl: string): string {
  return `${baseUrl}/api/payments/conference-return?session_id={CHECKOUT_SESSION_ID}`;
}

export function isConferencePaymentLinkSession(
  session: Pick<Stripe.Checkout.Session, "metadata">,
): boolean {
  return session.metadata?.product === CONFERENCE_PAYMENT_LINK_METADATA_PRODUCT;
}
