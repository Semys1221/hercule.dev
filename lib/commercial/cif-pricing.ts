import { COMMERCIAL_HERCULE_HUBRIS } from "@/lib/commercial/constants";
import { getPricingDocument } from "@/lib/site/pricing-data";
import type { PricingPlan } from "@/lib/site/pricing-types";

export const HUBRIS_PLAN_IDS = {
  optionA: "plan-hubris-option-a",
  optionB: "plan-hubris-option-b",
} as const;

export const CIF_PRICING_CTA = "Activer & Sécuriser mon calendrier";

export type HubrisOfferType =
  | typeof COMMERCIAL_HERCULE_HUBRIS.offerTypeOptionA
  | typeof COMMERCIAL_HERCULE_HUBRIS.offerTypeOptionB;

const HUBRIS_OFFER_TYPES = new Set<string>([
  COMMERCIAL_HERCULE_HUBRIS.offerTypeOptionA,
  COMMERCIAL_HERCULE_HUBRIS.offerTypeOptionB,
]);

export function isHubrisOfferType(value: string): value is HubrisOfferType {
  return HUBRIS_OFFER_TYPES.has(value);
}

export function offerTypeForPlan(plan: PricingPlan): HubrisOfferType | null {
  if (!plan.offerType || !isHubrisOfferType(plan.offerType)) {
    return null;
  }
  return plan.offerType;
}

export function getCifPricingPlans(): {
  optionA: PricingPlan;
  optionB: PricingPlan;
  document: NonNullable<ReturnType<typeof getPricingDocument>>;
} {
  const document = getPricingDocument("cif");
  if (!document) {
    throw new Error("CIF pricing document is missing");
  }

  const byId = new Map(document.plans.map((plan) => [plan.id, plan]));
  const optionA = byId.get(HUBRIS_PLAN_IDS.optionA);
  const optionB = byId.get(HUBRIS_PLAN_IDS.optionB);

  if (!optionA || !optionB) {
    throw new Error("Hercule Hubris pricing plans are incomplete");
  }

  return { optionA, optionB, document };
}
