"use client";

import { ComptablePricingGrid } from "@/components/comptable/comptable-pricing-grid";
import { Button } from "@/components/ui/button";
import type { OfferTypeComptable } from "@/lib/commercial/constants";
import { comptableOfferLabel } from "@/lib/commercial/comptable-pricing";

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
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Choisissez votre formule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paiement intégral à la souscription · 0 % de commission sur vos honoraires.
        </p>
      </div>

      <ComptablePricingGrid
        variant="checkout"
        selectedOffer={selectedOffer}
        ctaLabel="Sélectionner"
        onSelectOffer={onSelectOffer}
      />

      <p className="text-sm text-muted-foreground">
        Formule sélectionnée :{" "}
        <span className="font-medium text-foreground">
          {comptableOfferLabel(selectedOffer)}
        </span>
      </p>

      <Button type="button" className="w-full" onClick={onProceed}>
        Activer Hercule Comptable
      </Button>
    </div>
  );
}
