import {
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
} from "@/lib/commercial/constants";
import { getPricingDocument } from "@/lib/site/pricing-data";
import type { PricingPlan } from "@/lib/site/pricing-types";

export const CIF_PLAN_IDS = {
  lite: "plan-cif-lite",
  starter: "plan-cif-starter",
  pack3: "plan-cif-pack3",
} as const;

export const COMPTABLE_PRICING_CTA = "Activer & Sécuriser mon calendrier";
export const CIF_PRICING_CTA = COMPTABLE_PRICING_CTA;

const OFFER_TYPE_SET = new Set<string>(Object.values(OFFER_TYPES_COMPTABLE));

export function isOfferTypeComptable(value: string): value is OfferTypeComptable {
  return OFFER_TYPE_SET.has(value);
}

export function offerTypeForPlan(plan: PricingPlan): OfferTypeComptable | null {
  if (!plan.offerType || !isOfferTypeComptable(plan.offerType)) {
    return null;
  }
  return plan.offerType;
}

export function getCifPricingPlans(): {
  lite: PricingPlan;
  starter: PricingPlan;
  pack3: PricingPlan;
  document: NonNullable<ReturnType<typeof getPricingDocument>>;
} {
  const document = getPricingDocument("cif");
  if (!document) {
    throw new Error("CIF pricing document is missing");
  }

  const byId = new Map(document.plans.map((plan) => [plan.id, plan]));
  const lite = byId.get(CIF_PLAN_IDS.lite);
  const starter = byId.get(CIF_PLAN_IDS.starter);
  const pack3 = byId.get(CIF_PLAN_IDS.pack3);

  if (!lite || !starter || !pack3) {
    throw new Error("CIF pricing plans are incomplete");
  }

  return { lite, starter, pack3, document };
}
