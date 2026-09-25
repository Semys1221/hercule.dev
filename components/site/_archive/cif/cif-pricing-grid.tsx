"use client";

import { type KeyboardEvent, type ReactNode } from "react";

import { PricingCard } from "@/components/legacy/funnels/funnel-widgets/pricing-card";
import {
  CIF_PRICING_CTA,
  getCifPricingPlans,
  offerTypeForPlan,
  type HubrisOfferType,
} from "@/lib/commercial/cif-pricing";
import type { PricingPlan } from "@/lib/site/pricing-types";
import { PUBLIC_SITE_BOOKING_CLOSED } from "@/lib/constants";
import {
  MARKETING_INVITATION_ONLY_CTA,
  MARKETING_PRIMARY_CTA,
} from "@/lib/site/marketing-copy";
import { cn } from "@/lib/utils";

export type CifPricingGridProps = {
  variant?: "marketing" | "checkout";
  selectedOffer?: HubrisOfferType;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLinkLabel?: string;
  onSelectOffer?: (offerType: HubrisOfferType) => void;
  className?: string;
};

function isPlanSelected(plan: PricingPlan, selectedOffer?: HubrisOfferType): boolean {
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
  ctaLinkLabel = PUBLIC_SITE_BOOKING_CLOSED
    ? MARKETING_INVITATION_ONLY_CTA
    : MARKETING_PRIMARY_CTA,
  onSelectOffer,
  className,
}: CifPricingGridProps) {
  const { optionA, optionB, document } = getCifPricingPlans();
  const isCheckout = variant === "checkout";

  function handleSelect(planId: string) {
    const plan = [optionA, optionB].find((entry) => entry.id === planId);
    if (!plan || !onSelectOffer) {
      return;
    }
    const offerType = offerTypeForPlan(plan);
    if (offerType) {
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

  const optionASelected = isPlanSelected(optionA, selectedOffer);
  const optionBSelected = isPlanSelected(optionB, selectedOffer);

  const optionACard = (
    <PricingCard
      plan={{ ...optionA, featured: isCheckout ? optionASelected : optionA.featured }}
      index={0}
      {...sharedCardProps}
      ctaLabel={cardCtaLabel(optionA)}
      className="h-full transition-colors duration-200 group-hover/pricing-select:border-white/20"
      onCtaClick={isCheckout ? () => handleSelect(optionA.id) : undefined}
    />
  );

  const optionBCard = (
    <PricingCard
      plan={{ ...optionB, featured: isCheckout ? optionBSelected : optionB.featured }}
      index={1}
      {...sharedCardProps}
      ctaLabel={cardCtaLabel(optionB)}
      className="h-full transition-colors duration-200 group-hover/pricing-select:border-white/20"
      onCtaClick={isCheckout ? () => handleSelect(optionB.id) : undefined}
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
          selected={optionASelected}
          onSelect={() => handleSelect(optionA.id)}
        >
          {optionACard}
        </SelectablePricingShell>
      ) : (
        optionACard
      )}
      {isCheckout ? (
        <SelectablePricingShell
          selected={optionBSelected}
          onSelect={() => handleSelect(optionB.id)}
        >
          {optionBCard}
        </SelectablePricingShell>
      ) : (
        optionBCard
      )}
    </div>
  );
}
