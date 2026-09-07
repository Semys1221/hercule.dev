"use client";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { getPricingDocument } from "@/lib/site/pricing-data";

type StepPricingCardProps = {
  onProceed: () => void;
};

export function StepPricingCard({ onProceed }: StepPricingCardProps) {
  const document = getPricingDocument("agence");
  const starterPlan = document?.plans.find((plan) => plan.featured) ?? document?.plans[0];

  if (!document || !starterPlan) {
    return (
      <p className="text-sm text-destructive">
        Offre indisponible — configuration tarifaire manquante.
      </p>
    );
  }

  return (
    <PricingCard
      plan={starterPlan}
      compact
      animated={false}
      gatedTeaserFeatures={document.gatedTeaserFeatures}
      gatedGhostFeatures={document.gatedGhostFeatures}
      ctaLabel="Activer et sécuriser mon calendrier"
      onCtaClick={onProceed}
    />
  );
}
