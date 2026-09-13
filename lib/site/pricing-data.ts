import agencePricingData from "@/doc/legal-documentation/agence/pricing.json";
import cifPricingData from "@/doc/legal-documentation/cif/pricing.json";
import comptablePricingData from "@/doc/legal-documentation/comptable/pricing.json";
import { pricingJsonPath, type LegalDocumentationNiche } from "@/lib/legal-documentation/paths";
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

/** @deprecated Use pricingJsonPath from lib/legal-documentation/paths */
export function pricingContentPath(audience: LegalDocumentationNiche): string {
  return pricingJsonPath(audience as PricingAudience);
}
