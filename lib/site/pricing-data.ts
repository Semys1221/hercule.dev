import agencePricingData from "@/content/pricing/agence.json";
import type {
  PricingAudience,
  PricingComponentConfig,
  PricingDocument,
  PricingPlan,
} from "@/lib/site/pricing-types";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

const BUNDLED_AGENCE_PRICING = pricingDocumentSchema.parse(agencePricingData);

export function getBundledPricingDocument(audience: PricingAudience): PricingDocument | null {
  if (audience !== "agence") {
    return null;
  }
  return BUNDLED_AGENCE_PRICING;
}

export function getPricingDocument(audience: PricingAudience): PricingDocument | null {
  return getBundledPricingDocument(audience);
}

export function getPricingPlans(audience: PricingAudience): PricingPlan[] {
  return getPricingDocument(audience)?.plans ?? [];
}

export function resolvePricingForComponent(
  audience: PricingAudience,
  config?: PricingComponentConfig,
): PricingPlan[] {
  const plans = getPricingPlans(audience);
  if (!config?.hiddenPlanIds?.length) {
    return plans;
  }
  const hidden = new Set(config.hiddenPlanIds);
  return plans.filter((plan) => !hidden.has(plan.id));
}
