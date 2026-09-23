import {
  FREE_TRIAL_STRIPE_PRODUCT,
} from "@/lib/commercial/constants";
import {
  CONFERENCE_CLIENT_TYPES,
  OFFER_TYPES_CONFERENCE,
  type ConferenceClientType,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";

import type { ClientProductStatut, ClientRow } from "./types";
import { isFreeTrialProductStatut } from "./dec-free-trial";

export const COURTAGE_FREE_TRIAL_SOURCE = "courtage_free_trial" as const;

export const COURTAGE_FREE_TRIAL_RDV_TOTAL = 1;
export const COURTAGE_FREE_TRIAL_CONVERTED_RDV_TOTAL = 25;

const COURTAGE_TRIAL_CLIENT_TYPES = new Set<string>([
  CONFERENCE_CLIENT_TYPES.cif,
  CONFERENCE_CLIENT_TYPES.ias,
]);

export function courtageTrialOfferType(
  clientType: ConferenceClientType,
): ConferenceOfferType {
  if (clientType === CONFERENCE_CLIENT_TYPES.cif) {
    return OFFER_TYPES_CONFERENCE.cifMonthly;
  }
  return OFFER_TYPES_CONFERENCE.iasMonthly;
}

export function isCourtageFreeTrialClientType(
  value: string | null | undefined,
): value is ConferenceClientType {
  return Boolean(value && COURTAGE_TRIAL_CLIENT_TYPES.has(value));
}

export function isCourtageFreeTrialCheckoutMetadata(
  metadata: Record<string, string> | null | undefined,
): boolean {
  if (!metadata) return false;
  const clientType = metadata.client_type;
  return (
    metadata.source === COURTAGE_FREE_TRIAL_SOURCE &&
    metadata.product === FREE_TRIAL_STRIPE_PRODUCT &&
    isCourtageFreeTrialClientType(clientType)
  );
}

export function isCourtageFreeTrialClient(
  row: Pick<ClientRow, "client_type" | "offer_type" | "product_statut">,
): boolean {
  if (!isCourtageFreeTrialClientType(row.client_type)) return false;
  if (!isFreeTrialProductStatut(row.product_statut)) return false;
  const offer = row.offer_type;
  return (
    offer === OFFER_TYPES_CONFERENCE.cifMonthly ||
    offer === OFFER_TYPES_CONFERENCE.iasMonthly
  );
}
