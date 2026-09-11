"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { PricingFlipCard } from "@/components/cif/pricing-flip-card";
import type { OfferTypeComptable } from "@/lib/commercial/constants";
import {
  CIF_PRICING_CTA,
  getCifPricingPlans,
  offerTypeForPlan,
} from "@/lib/commercial/cif-pricing";
import type { PricingPlan } from "@/lib/site/pricing-types";
import { cn } from "@/lib/utils";

export type CifPricingGridProps = {
  variant?: "marketing" | "checkout";
  selectedOffer?: OfferTypeComptable;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLinkLabel?: string;
  onSelectOffer?: (offerType: OfferTypeComptable) => void;
  className?: string;
};

function isPlanSelected(plan: PricingPlan, selectedOffer?: OfferTypeComptable): boolean {
  if (!selectedOffer) {
    return false;
  }
  return offerTypeForPlan(plan) === selectedOffer;
}

function SelectablePricingShell({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        "group/pricing-select rounded-xl transition-all duration-200 outline-none",
        "hover:ring-2 hover:ring-foreground/45 hover:shadow-[0_0_28px_rgba(255,255,255,0.05)]",
        "focus-visible:ring-2 focus-visible:ring-foreground/60",
        selected
          ? "ring-2 ring-foreground shadow-[0_0_32px_rgba(255,255,255,0.08)]"
          : "ring-1 ring-border",
      )}
    >
      {children}
    </div>
  );
}

export function CifPricingGrid({
  variant = "marketing",
  selectedOffer,
  ctaLabel = CIF_PRICING_CTA,
  ctaHref,
  ctaLinkLabel = "Proposer mon cabinet",
  onSelectOffer,
  className,
}: CifPricingGridProps) {
  const { lite, starter, pack3, document } = getCifPricingPlans();
  const isCheckout = variant === "checkout";

  function handleSelect(planId: string) {
    const plan = [lite, starter, pack3].find((entry) => entry.id === planId);
    if (!plan || !onSelectOffer) {
      return;
    }
    const offerType = offerTypeForPlan(plan);
    if (offerType) {
      // #region agent log
      if (isCheckout) {
        fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c39d02",
          },
          body: JSON.stringify({
            sessionId: "c39d02",
            runId: "post-fix",
            hypothesisId: "pricing-ui",
            location: "cif-pricing-grid.tsx:handleSelect",
            message: "comptable pricing card selected",
            data: { planId, offerType, previousOffer: selectedOffer ?? null },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      onSelectOffer(offerType);
    }
  }

  function cardCtaLabel(plan: PricingPlan): string | undefined {
    if (!isCheckout) {
      return undefined;
    }
    return isPlanSelected(plan, selectedOffer) ? "Formule sélectionnée" : ctaLabel;
  }

  const sharedCardProps = {
    compact: isCheckout,
    animated: false,
    gatedTeaserFeatures: document.gatedTeaserFeatures,
    gatedGhostFeatures: document.gatedGhostFeatures,
    forceCta: isCheckout,
    ctaHref,
    ctaLinkLabel,
  };

  const [flipCardShowingPack3, setFlipCardShowingPack3] = useState(false);

  const liteSelected = isPlanSelected(lite, selectedOffer);
  const pack3Selected = isPlanSelected(pack3, selectedOffer);
  const starterSelected = isPlanSelected(starter, selectedOffer);
  const flipColumnSelected = liteSelected || pack3Selected;
  const visibleFlipPlanId = flipCardShowingPack3 ? pack3.id : lite.id;

  const flipCard = (
    <PricingFlipCard
      className="h-full"
      onFlipChange={setFlipCardShowingPack3}
      front={
        <PricingCard
          plan={{ ...lite, featured: isCheckout ? liteSelected : lite.featured }}
          {...sharedCardProps}
          ctaLabel={cardCtaLabel(lite)}
          className="h-full transition-colors duration-200 group-hover/pricing-select:border-white/20"
          onCtaClick={isCheckout ? () => handleSelect(lite.id) : undefined}
        />
      }
      back={
        <PricingCard
          plan={{
            ...pack3,
            featured: isCheckout ? pack3Selected : true,
          }}
          {...sharedCardProps}
          ctaLabel={cardCtaLabel(pack3)}
          className="h-full transition-colors duration-200 group-hover/pricing-select:border-white/20"
          showRecommendedBadge={false}
          onCtaClick={isCheckout ? () => handleSelect(pack3.id) : undefined}
        />
      }
    />
  );

  const starterCard = (
    <PricingCard
      plan={{ ...starter, featured: isCheckout ? starterSelected : starter.featured }}
      index={1}
      {...sharedCardProps}
      ctaLabel={cardCtaLabel(starter)}
      className="h-full transition-colors duration-200 group-hover/pricing-select:border-white/20"
      onCtaClick={isCheckout ? () => handleSelect(starter.id) : undefined}
    />
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch",
        className,
      )}
    >
      {isCheckout ? (
        <SelectablePricingShell
          selected={flipColumnSelected}
          onSelect={() => handleSelect(visibleFlipPlanId)}
        >
          {flipCard}
        </SelectablePricingShell>
      ) : (
        flipCard
      )}
      {isCheckout ? (
        <SelectablePricingShell
          selected={starterSelected}
          onSelect={() => handleSelect(starter.id)}
        >
          {starterCard}
        </SelectablePricingShell>
      ) : (
        starterCard
      )}
    </div>
  );
}
