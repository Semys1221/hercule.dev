"use client";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { Button } from "@/components/ui/button";
import { OFFER_TYPES_COMPTABLE, type OfferTypeComptable } from "@/lib/commercial/constants";
import { getPricingDocument } from "@/lib/site/pricing-data";
import { cn } from "@/lib/utils";

const PLAN_TO_OFFER: Record<string, OfferTypeComptable> = {
  "plan-comptable-starter": OFFER_TYPES_COMPTABLE.starter999_5,
  "plan-comptable-croissance": OFFER_TYPES_COMPTABLE.monthly1499,
  "plan-comptable-pack3": OFFER_TYPES_COMPTABLE.pack3x1499,
};

type StepPricingCardComptableProps = {
  selectedOffer: OfferTypeComptable;
  onSelectOffer: (offer: OfferTypeComptable) => void;
  onProceed: () => void;
};

export function StepPricingCardComptable({
  selectedOffer,
  onSelectOffer,
  onProceed,
}: StepPricingCardComptableProps) {
  const document = getPricingDocument("comptable");
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
          Paiement intégral à la souscription · 0 % de commission sur vos honoraires.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        Activer Hercule Comptable
      </Button>
    </div>
  );
}
