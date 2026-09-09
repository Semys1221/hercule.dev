import {
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
} from "@/lib/commercial/constants";
import { getPricingDocument } from "@/lib/site/pricing-data";
import type { PricingPlan } from "@/lib/site/pricing-types";

export const COMPTABLE_PLAN_IDS = {
  lite: "plan-comptable-lite",
  starter: "plan-comptable-starter",
  pack3: "plan-comptable-pack3",
} as const;

export const COMPTABLE_PRICING_CTA = "Activer & Sécuriser mon calendrier";

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

export function getComptablePricingPlans(): {
  lite: PricingPlan;
  starter: PricingPlan;
  pack3: PricingPlan;
  document: NonNullable<ReturnType<typeof getPricingDocument>>;
} {
  const document = getPricingDocument("comptable");
  if (!document) {
    throw new Error("Comptable pricing document is missing");
  }

  const byId = new Map(document.plans.map((plan) => [plan.id, plan]));
  const lite = byId.get(COMPTABLE_PLAN_IDS.lite);
  const starter = byId.get(COMPTABLE_PLAN_IDS.starter);
  const pack3 = byId.get(COMPTABLE_PLAN_IDS.pack3);

  if (!lite || !starter || !pack3) {
    throw new Error("Comptable pricing plans are incomplete");
  }

  return { lite, starter, pack3, document };
}

export const COMPTABLE_OFFER_LABELS: Record<OfferTypeComptable, string> = {
  [OFFER_TYPES_COMPTABLE.starter999_5]: "Hercule Lite — 999 € TTC",
  [OFFER_TYPES_COMPTABLE.monthly1499]: "Hercule Starter — 1 499 €/mois",
  [OFFER_TYPES_COMPTABLE.pack3x1499]: "Pack 3 mois Starter — 3 598 € TTC",
};

export function comptableOfferLabel(offerType: string | null | undefined): string {
  if (offerType && isOfferTypeComptable(offerType)) {
    return COMPTABLE_OFFER_LABELS[offerType];
  }
  return COMPTABLE_OFFER_LABELS[OFFER_TYPES_COMPTABLE.monthly1499];
}
