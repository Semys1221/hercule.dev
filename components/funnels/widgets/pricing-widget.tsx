"use client";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import type { PricingComponentConfig, PricingPlan } from "@/lib/site/pricing-types";
import { getPricingDocument, resolvePricingForComponent } from "@/lib/site/pricing-data";

type PricingWidgetProps = {
  audience: "agence" | "entreprise";
  config?: PricingComponentConfig;
  compact?: boolean;
  plans?: PricingPlan[];
};

export function PricingWidget({ audience, config, compact = true, plans }: PricingWidgetProps) {
  const document = getPricingDocument(audience);
  const resolvedPlans = plans ?? resolvePricingForComponent(audience, config);

  if (resolvedPlans.length === 0 || !document) {
    return (
      <p className="text-sm text-muted-foreground">Aucune offre tarifaire pour cette audience.</p>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
      {resolvedPlans.map((plan, index) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          index={index}
          compact={compact}
          animated={!compact}
          gatedTeaserFeatures={document.gatedTeaserFeatures}
          gatedGhostFeatures={document.gatedGhostFeatures}
        />
      ))}
    </div>
  );
}
