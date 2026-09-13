"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OfferTypeComptable } from "@/lib/commercial/constants";
import {
  type CabinetCheckoutOfferOption,
  cabinetCheckoutBrandLabel,
  type CabinetCheckoutAudience,
} from "@/lib/payments/cabinet-checkout";

type CabinetCheckoutOfferPickerProps = {
  audience: CabinetCheckoutAudience;
  offers: CabinetCheckoutOfferOption[];
  selectedOffer: OfferTypeComptable | null;
  onSelectOffer: (offerType: OfferTypeComptable) => void;
  onContinue: () => void;
};

export function CabinetCheckoutOfferPicker({
  audience,
  offers,
  selectedOffer,
  onSelectOffer,
  onContinue,
}: CabinetCheckoutOfferPickerProps) {
  if (offers.length === 0) {
    return (
      <p className="text-sm text-destructive">
        Offre indisponible — configuration tarifaire manquante.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sélectionnez votre formule pour finaliser votre accès Hercule{" "}
        {cabinetCheckoutBrandLabel(audience)}.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {offers.map((offer) => (
          <Card
            key={offer.offerType}
            className={`cursor-pointer transition-colors ${
              selectedOffer === offer.offerType
                ? "border-foreground"
                : "hover:border-muted-foreground/50"
            }`}
            onClick={() => onSelectOffer(offer.offerType)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {offer.label}
                {offer.featured ? (
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                    Recommandé
                  </span>
                ) : null}
              </CardTitle>
              <p className="text-lg font-semibold">{offer.price}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{offer.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button className="w-full" disabled={!selectedOffer} onClick={onContinue}>
        Finaliser le paiement
      </Button>
    </div>
  );
}
