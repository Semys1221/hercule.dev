"use client";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  formatAgenceFastFirstRdvLabel,
  formatAgenceStandardFirstRdvLabel,
  OFFER_TYPES,
  PAYMENT_PHASES,
  totalPriceCentsForOffer,
  type AgenceCheckoutOfferType,
} from "@/lib/commercial/constants";
import { amountCentsForAgenceOffer } from "@/lib/payments/agence-offers";
import { getPricingDocument } from "@/lib/site/pricing-data";
import { cn } from "@/lib/utils";

const PLAN_TO_OFFER: Record<string, AgenceCheckoutOfferType> = {
  "plan-starter": OFFER_TYPES.starter998_5,
  "plan-growth": OFFER_TYPES.growth1498_10,
};

function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type StepPricingCardProps = {
  selectedOffer: AgenceCheckoutOfferType;
  onSelectOffer: (offer: AgenceCheckoutOfferType) => void;
  fastEnabled: boolean;
  onFastChange: (enabled: boolean) => void;
  onProceed: () => void;
};

export function StepPricingCard({
  selectedOffer,
  onSelectOffer,
  fastEnabled,
  onFastChange,
  onProceed,
}: StepPricingCardProps) {
  const document = getPricingDocument("agence");
  const purchasablePlans =
    document?.plans.filter((plan) => !plan.profileOnly) ?? [];

  const depositCents = amountCentsForAgenceOffer(selectedOffer, PAYMENT_PHASES.deposit);
  const fullCents = totalPriceCentsForOffer(selectedOffer);

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
          {fastEnabled
            ? `Paiement intégral — premier RDV sous ${formatAgenceFastFirstRdvLabel()}.`
            : `50 % à la commande · 50 % à la livraison · premier RDV sous ${formatAgenceStandardFirstRdvLabel()}.`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {purchasablePlans.map((plan) => {
          const offerType = PLAN_TO_OFFER[plan.id];
          if (!offerType) {
            return null;
          }
          const isSelected = selectedOffer === offerType;
          const planFullCents = totalPriceCentsForOffer(offerType);
          const deliveryLabel = fastEnabled
            ? `Premier RDV sous ${formatAgenceFastFirstRdvLabel()}`
            : `Premier RDV sous ${formatAgenceStandardFirstRdvLabel()}`;

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
                plan={{
                  ...plan,
                  featured: isSelected,
                  footer: fastEnabled
                    ? `${formatEuros(planFullCents)} à la commande · ${deliveryLabel}`
                    : plan.footer,
                }}
                compact
                animated={false}
                forceCta
                gatedTeaserFeatures={document.gatedTeaserFeatures}
                gatedGhostFeatures={document.gatedGhostFeatures}
                ctaLabel={isSelected ? "Formule sélectionnée" : "Sélectionner"}
                onCtaClick={() => onSelectOffer(offerType)}
              />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="pricing-fast"
            checked={fastEnabled}
            onCheckedChange={(value) => onFastChange(value === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="pricing-fast" className="cursor-pointer text-sm font-medium">
              Fast
            </Label>
            <p className="text-sm text-muted-foreground">
              Payer la totalité maintenant ({formatEuros(fullCents)}) et passer le premier RDV de{" "}
              {formatAgenceStandardFirstRdvLabel()} à {formatAgenceFastFirstRdvLabel()}.
            </p>
          </div>
        </div>
      </div>

      <Button type="button" className="w-full" onClick={onProceed}>
        {fastEnabled
          ? `Activer en Fast — ${formatEuros(fullCents)}`
          : `Activer — ${formatEuros(depositCents)} maintenant`}
      </Button>
    </div>
  );
}
