"use client";

import { useState } from "react";

import { CifPricingGrid } from "@/components/site/cif/cif-pricing-grid";
import {
  CIF_PRICING_CTA,
  type HubrisOfferType,
} from "@/lib/commercial/cif-pricing";
import { cn } from "@/lib/utils";

export type CifPricingCheckoutProps = {
  slug: string;
  variant?: "sales" | "dashboard";
  ctaLabel?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Display Hercule Hubris pricing (canon v3).
 * Stripe checkout for hercule_hubris_* offer types is not wired yet (Notion Phase 3).
 */
export function CifPricingCheckout({
  variant = "dashboard",
  ctaLabel = CIF_PRICING_CTA,
  className,
  disabled = false,
}: CifPricingCheckoutProps) {
  const [selectedOffer, setSelectedOffer] = useState<HubrisOfferType | null>(null);

  return (
    <div className={cn("space-y-4", className)}>
      {variant === "dashboard" ? (
        <p className="text-sm text-muted-foreground">
          Hercule Hubris — sélectionnez Option A (4 000 € flat) ou Option B
          (1 800 €/mois × 3).
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Choisissez la formule Hercule Hubris pour ce cabinet. Checkout Stripe à venir.
        </p>
      )}

      <div
        className={cn(
          variant === "sales" && "rounded-xl border border-border bg-background p-4 md:p-6",
        )}
      >
        <CifPricingGrid
          variant={disabled ? "marketing" : "checkout"}
          selectedOffer={selectedOffer ?? undefined}
          ctaLabel={ctaLabel}
          onSelectOffer={
            disabled
              ? undefined
              : (offerType) => {
                  setSelectedOffer(offerType);
                }
          }
        />
      </div>

      {selectedOffer && !disabled ? (
        <p className="text-sm text-muted-foreground">
          Formule sélectionnée : {selectedOffer}. Le paiement Stripe Hercule Hubris n&apos;est
          pas encore activé — finalisez via contact@hercule.dev.
        </p>
      ) : null}

      {disabled ? (
        <p className="text-sm text-muted-foreground">
          Sélectionnez un lead CRM pour activer le checkout.
        </p>
      ) : null}
    </div>
  );
}
