import agencePricingData from "@/site-content/legal-documentation/agence/pricing.json";
import assurancePricingData from "@/site-content/legal-documentation/assurance/pricing.json";
import cifPricingData from "@/site-content/legal-documentation/cif/pricing.json";
import comptablePricingData from "@/site-content/legal-documentation/comptable/pricing.json";
import type {
  PricingAudience,
  PricingComponentConfig,
  PricingDocument,
  PricingPlan,
} from "@/lib/site/pricing-types";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

const BUNDLED_PRICING: Record<PricingAudience, PricingDocument> = {
  agence: pricingDocumentSchema.parse(agencePricingData),
  comptable: pricingDocumentSchema.parse(comptablePricingData),
  cif: pricingDocumentSchema.parse(cifPricingData),
  assurance: pricingDocumentSchema.parse(assurancePricingData),
};

export function getBundledPricingDocument(audience: PricingAudience): PricingDocument | null {
  return BUNDLED_PRICING[audience] ?? null;
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
