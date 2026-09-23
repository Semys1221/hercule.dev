import {
  CONFERENCE_PRICING_AMOUNTS,
  OFFER_TYPES_CONFERENCE,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import {
  getConferenceCourtageMonthlyPriceId,
  getConferenceCourtagePackPriceId,
  getConferenceDecMonthlyPriceId,
  getConferenceDecPackPriceId,
} from "@/lib/legacy/payments/stripe";
import type Stripe from "stripe";

const CONFERENCE_OFFER_TYPE_SET = new Set<string>(
  Object.values(OFFER_TYPES_CONFERENCE),
);

export function isConferenceOfferType(
  value: string,
): value is ConferenceOfferType {
  return CONFERENCE_OFFER_TYPE_SET.has(value);
}

export function priceIdForConferenceOffer(offerType: ConferenceOfferType): string {
  switch (offerType) {
    case OFFER_TYPES_CONFERENCE.decMonthly:
      return getConferenceDecMonthlyPriceId();
    case OFFER_TYPES_CONFERENCE.decPack:
      return getConferenceDecPackPriceId();
    case OFFER_TYPES_CONFERENCE.cifMonthly:
    case OFFER_TYPES_CONFERENCE.iasMonthly:
      return getConferenceCourtageMonthlyPriceId();
    case OFFER_TYPES_CONFERENCE.cifPack:
    case OFFER_TYPES_CONFERENCE.iasPack:
      return getConferenceCourtagePackPriceId();
    default:
      throw new Error(`Unknown conference offer type: ${offerType}`);
  }
}

export function amountCentsForConferenceOffer(
  offerType: ConferenceOfferType,
): number {
  switch (offerType) {
    case OFFER_TYPES_CONFERENCE.decMonthly:
      return CONFERENCE_PRICING_AMOUNTS.decMonthlyCents;
    case OFFER_TYPES_CONFERENCE.decPack:
      return CONFERENCE_PRICING_AMOUNTS.decPackCents;
    case OFFER_TYPES_CONFERENCE.cifMonthly:
    case OFFER_TYPES_CONFERENCE.iasMonthly:
      return CONFERENCE_PRICING_AMOUNTS.courtageMonthlyCents;
    case OFFER_TYPES_CONFERENCE.cifPack:
    case OFFER_TYPES_CONFERENCE.iasPack:
      return CONFERENCE_PRICING_AMOUNTS.courtagePackCents;
    default:
      throw new Error(`Unknown conference offer type: ${offerType}`);
  }
}

export function stripeCheckoutModeForConferencePrice(
  price: Pick<Stripe.Price, "type">,
): "subscription" | "payment" {
  return price.type === "recurring" ? "subscription" : "payment";
}
