"use client";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { Button } from "@/components/ui/button";
import { OFFER_TYPES, type AgenceCheckoutOfferType } from "@/lib/commercial/constants";
import { getPricingDocument } from "@/lib/site/pricing-data";
import { cn } from "@/lib/utils";

const PLAN_TO_OFFER: Record<string, AgenceCheckoutOfferType> = {
  "plan-starter": OFFER_TYPES.starter998_5,
  "plan-growth": OFFER_TYPES.growth1498_10,
};

type StepPricingCardProps = {
  selectedOffer: AgenceCheckoutOfferType;
  onSelectOffer: (offer: AgenceCheckoutOfferType) => void;
  onProceed: () => void;
};

export function StepPricingCard({
  selectedOffer,
  onSelectOffer,
  onProceed,
}: StepPricingCardProps) {
  const document = getPricingDocument("agence");
  const purchasablePlans =
    document?.plans.filter((plan) => !plan.profileOnly) ?? [];

  if (!document || purchasablePlans.length === 0) {
    return (
      <p className="text-sm text-destructive">
        Offre indisponible — configuration tarifaire manquante.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Choisissez votre formule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          50 % à la commande · 50 % à la livraison de vos contrats PME sécurisés.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {purchasablePlans.map((plan) => {
          const offerType = PLAN_TO_OFFER[plan.id];
          if (!offerType) {
            return null;
          }
          const isSelected = selectedOffer === offerType;

          return (
            <div
              key={plan.id}
              className={cn(
                "cursor-pointer rounded-xl transition-colors",
                isSelected ? "ring-2 ring-foreground" : "ring-1 ring-border",
              )}
              onClick={() => onSelectOffer(offerType)}
            >
              <PricingCard
                plan={plan}
                compact
                animated={false}
                gatedTeaserFeatures={document.gatedTeaserFeatures}
                gatedGhostFeatures={document.gatedGhostFeatures}
                ctaLabel={isSelected ? "Formule sélectionnée" : "Sélectionner"}
                onCtaClick={() => onSelectOffer(offerType)}
              />
            </div>
          );
        })}
      </div>

      <Button type="button" className="w-full" onClick={onProceed}>
        Activer et sécuriser mes contrats
      </Button>
    </div>
  );
}
