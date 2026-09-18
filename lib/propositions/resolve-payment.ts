import type { PropositionConfig, PropositionPricingOption } from "@/lib/propositions/schema";

export function getPricingOptions(
  config: PropositionConfig,
): PropositionPricingOption[] | null {
  const options = config.proposal.pricing.options;
  if (!options || options.length === 0) {
    return null;
  }
  return options;
}

export function resolveStripePaymentLinkUrl(
  config: PropositionConfig,
  selectedPricingOptionId: string | null,
): string {
  const options = getPricingOptions(config);
  if (options) {
    const selected =
      options.find((option) => option.id === selectedPricingOptionId) ??
      options.find((option) => option.recommended) ??
      options[0];
    if (selected) {
      return selected.stripePaymentLinkUrl;
    }
  }
  return config.payment.stripePaymentLinkUrl;
}
