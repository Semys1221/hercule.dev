"use client";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { PricingFlipCard } from "@/components/comptable/pricing-flip-card";
import type { OfferTypeComptable } from "@/lib/commercial/constants";
import {
  COMPTABLE_PRICING_CTA,
  getComptablePricingPlans,
  offerTypeForPlan,
} from "@/lib/commercial/comptable-pricing";
import { cn } from "@/lib/utils";

export type ComptablePricingGridProps = {
  variant?: "marketing" | "checkout";
  ctaLabel?: string;
  ctaHref?: string;
  ctaLinkLabel?: string;
  onSelectOffer?: (offerType: OfferTypeComptable) => void;
  className?: string;
};

export function ComptablePricingGrid({
  variant = "marketing",
  ctaLabel = COMPTABLE_PRICING_CTA,
  ctaHref,
  ctaLinkLabel = "Proposer mon cabinet",
  onSelectOffer,
  className,
}: ComptablePricingGridProps) {
  const { lite, starter, pack3, document } = getComptablePricingPlans();
  const isCheckout = variant === "checkout";

  function handleSelect(planId: string) {
    const plan = [lite, starter, pack3].find((entry) => entry.id === planId);
    if (!plan || !onSelectOffer) {
      return;
    }
    const offerType = offerTypeForPlan(plan);
    if (offerType) {
      onSelectOffer(offerType);
    }
  }

  const sharedCardProps = {
    compact: isCheckout,
    animated: false,
    gatedTeaserFeatures: document.gatedTeaserFeatures,
    gatedGhostFeatures: document.gatedGhostFeatures,
    ctaLabel: isCheckout ? ctaLabel : undefined,
    forceCta: isCheckout,
    ctaHref,
    ctaLinkLabel,
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch",
        className,
      )}
    >
      <PricingFlipCard
        className="h-full"
        front={
          <PricingCard
            plan={lite}
            {...sharedCardProps}
            className="h-full"
            onCtaClick={
              isCheckout ? () => handleSelect(lite.id) : undefined
            }
          />
        }
        back={
          <PricingCard
            plan={{ ...pack3, featured: true }}
            {...sharedCardProps}
            className="h-full"
            showRecommendedBadge={false}
            onCtaClick={
              isCheckout ? () => handleSelect(pack3.id) : undefined
            }
          />
        }
      />
      <PricingCard
        plan={starter}
        index={1}
        {...sharedCardProps}
        className="h-full"
        onCtaClick={isCheckout ? () => handleSelect(starter.id) : undefined}
      />
    </div>
  );
}
