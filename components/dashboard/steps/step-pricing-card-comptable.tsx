"use client";

import { Check } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COMMERCIAL_COMPTABLE,
  FOUNDATION_HORIZON_GUARANTEE_COPY,
  FOUNDATION_PRICING_PLANS,
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
  formatFoundationEuros,
  foundationOfferLabel,
} from "@/lib/commercial/constants";
import { cn } from "@/lib/utils";

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
  const showHorizonGuarantee =
    selectedOffer === OFFER_TYPES_COMPTABLE.monthly1499;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Choisissez votre formule Foundation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paiement intégral à la souscription · 0 % de commission sur vos honoraires.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FOUNDATION_PRICING_PLANS.map((plan) => {
          const isSelected = selectedOffer === plan.offerType;

          return (
            <Card
              key={plan.id}
              className={cn(
                "cursor-pointer transition-colors",
                isSelected ? "ring-2 ring-foreground" : "ring-1 ring-border",
              )}
              onClick={() => onSelectOffer(plan.offerType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {plan.recommended ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      Recommandé
                    </Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
                <p className="pt-1 text-2xl font-medium tracking-tight">
                  {formatFoundationEuros(plan.priceCents)}
                  <span className="text-sm font-normal text-muted-foreground">/mois</span>
                </p>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectOffer(plan.offerType);
                  }}
                >
                  {isSelected ? "Formule sélectionnée" : "Sélectionner"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {showHorizonGuarantee ? (
        <Alert>
          <AlertTitle>
            Garantie contractuelle Horizon {COMMERCIAL_COMPTABLE.horizonGuaranteeMonths} mois
          </AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {FOUNDATION_HORIZON_GUARANTEE_COPY}
          </AlertDescription>
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Formule sélectionnée :{" "}
        <span className="font-medium text-foreground">
          {foundationOfferLabel(selectedOffer)}
        </span>
      </p>

      <Button type="button" className="w-full" onClick={onProceed}>
        Activer Hercule Foundation
      </Button>
    </div>
  );
}
