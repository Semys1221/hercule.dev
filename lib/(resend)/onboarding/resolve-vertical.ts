import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

import type { PaymentOnboardingVertical } from "./constants";

export type ComptableStripeOwner = "comptable" | "cif" | "entreprise";

export function resolveVerticalFromOwner(
  owner: ComptableStripeOwner,
): PaymentOnboardingVertical {
  if (owner === "cif") return "cif";
  if (owner === "entreprise") return "ias";
  return "dec";
}

export function leadCategoryFromOwner(owner: ComptableStripeOwner): LeadCategory {
  if (owner === "cif") return "cif";
  if (owner === "entreprise") return "entreprise";
  return "comptable";
}

export function isPaymentOnboardingOwner(owner: ComptableStripeOwner): boolean {
  return owner === "comptable" || owner === "cif" || owner === "entreprise";
}
