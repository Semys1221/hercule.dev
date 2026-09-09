"use client";

import { ComptablePricingCheckout } from "@/components/comptable/comptable-pricing-checkout";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  isSalesClosingReadyForDashboardLink,
  type SalesClosingValues,
} from "@/components/internal/funnels/sales/sales-closing-sections";

type SalesComptablePricingPanelProps = {
  slug: string | null;
  developerMode?: boolean;
  closingValues: SalesClosingValues;
};

export function SalesComptablePricingPanel({
  slug,
  developerMode = false,
  closingValues,
}: SalesComptablePricingPanelProps) {
  const tieDownsReady =
    developerMode || isSalesClosingReadyForDashboardLink(closingValues);
  const checkoutEnabled = Boolean(slug) && tieDownsReady;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {!developerMode && !tieDownsReady ? (
          <InternalStatusAlert
            variant="error"
            message="Validez les tie-downs « règles de traitement » et « calendrier » avant d'ouvrir le checkout."
          />
        ) : null}

        {!developerMode && !slug ? (
          <InternalStatusAlert
            variant="error"
            message="Aucun lead associé — sélectionnez un rendez-vous avec fiche CRM."
          />
        ) : null}

        {developerMode && !slug ? (
          <InternalStatusAlert
            variant="info"
            message="Mode développeur — aperçu des cartes pricing sans checkout Stripe."
          />
        ) : null}

        <ComptablePricingCheckout
          slug={slug ?? "preview"}
          variant="sales"
          disabled={!checkoutEnabled}
        />
      </CardContent>
    </Card>
  );
}
