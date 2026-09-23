import {
  FREE_TRIAL_STRIPE_PRODUCT,
  OFFER_TYPES_COMPTABLE,
} from "@/lib/commercial/constants";
import { CONFERENCE_CLIENT_TYPES } from "@/lib/commercial/conference-pricing";

import type { ClientProductStatut, ClientRow } from "./types";

export const DEC_FREE_TRIAL_SOURCE = "dec_free_trial" as const;

export const PRODUCT_STATUT_FREE_TRIAL_PENDING =
  "FREE_TRIAL_PENDING_ONBOARDING" satisfies ClientProductStatut;
export const PRODUCT_STATUT_FREE_TRIAL = "FREE_TRIAL" satisfies ClientProductStatut;

export const DEC_FREE_TRIAL_RDV_TOTAL = 1;
export const DEC_FREE_TRIAL_CONVERTED_RDV_TOTAL = 10;

export const CLIENT_CGV_FREE_TRIAL_VERSION = "2026-09-23-ft";

const FREE_TRIAL_STATUTS = new Set<string>([
  PRODUCT_STATUT_FREE_TRIAL_PENDING,
  PRODUCT_STATUT_FREE_TRIAL,
]);

export function isDecFreeTrialOffer(offerType: string | null | undefined): boolean {
  return offerType === OFFER_TYPES_COMPTABLE.monthly1499Trial;
}

export function isDecFreeTrialClient(
  row: Pick<ClientRow, "client_type" | "offer_type">,
): boolean {
  return (
    row.client_type === CONFERENCE_CLIENT_TYPES.dec &&
    isDecFreeTrialOffer(row.offer_type)
  );
}

export function isFreeTrialProductStatut(statut: string | null | undefined): boolean {
  return Boolean(statut && FREE_TRIAL_STATUTS.has(statut));
}

export function isDecFreeTrialCheckoutMetadata(
  metadata: Record<string, string> | null | undefined,
): boolean {
  if (!metadata) return false;
  return (
    metadata.source === DEC_FREE_TRIAL_SOURCE &&
    metadata.product === FREE_TRIAL_STRIPE_PRODUCT &&
    isDecFreeTrialOffer(metadata.offer_type)
  );
}

export function isCalendlySchedulingUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "calendly.com" || host.endsWith(".calendly.com"))
    );
  } catch {
    return false;
  }
}
