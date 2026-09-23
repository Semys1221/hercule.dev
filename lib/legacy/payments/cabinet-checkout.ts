/** @deprecated Checkout embedded removed — conference Payment Links only. */

import type { OfferTypeComptable } from "@/lib/commercial/constants";

export const CONFERENCE_INSCRIPTION_PATH = "/conference/inscription";

export type CabinetCheckoutAudience = "comptable" | "cif";

export type CabinetCheckoutOfferId = string;

export type CabinetCheckoutOfferOption = {
  offerType: OfferTypeComptable;
  label: string;
  price: string;
  description: string;
  featured?: boolean;
};

export function cabinetCheckoutBrandLabel(audience: CabinetCheckoutAudience): string {
  return audience === "cif" ? "CIF" : "Comptable";
}

export function parseComptableCheckoutOfferQuery(
  _offerQuery: string | null | undefined,
): OfferTypeComptable | null {
  return null;
}

export function buildCabinetCheckoutOfferOptions(
  _audience: CabinetCheckoutAudience,
): CabinetCheckoutOfferOption[] {
  return [];
}

export function buildCabinetCheckoutDashboardUrl(
  _dashboardLink: string,
  _offer: CabinetCheckoutOfferId,
): string {
  return CONFERENCE_INSCRIPTION_PATH;
}

export async function requestCabinetCheckoutClientSecret(
  _audience?: CabinetCheckoutAudience,
  _slug?: string,
  _offer?: OfferTypeComptable | null,
): Promise<string> {
  throw new Error("Le paiement se fait via la page conférence.");
}
