"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { OfferTypeComptable } from "@/lib/commercial/constants";
import type { DashboardFaqAudience } from "@/lib/legacy/dashboard/types";
import { CONFERENCE_INSCRIPTION_PATH } from "@/lib/legacy/payments/cabinet-checkout";

type StepEmbeddedCheckoutComptableProps = {
  slug?: string;
  audience?: Extract<DashboardFaqAudience, "comptable" | "cif">;
  selectedOffer?: OfferTypeComptable | null;
  startImmediately?: boolean;
  clientSecret?: string | null;
  preloadError?: string | null;
};

export function StepEmbeddedCheckoutComptable(
  _props: StepEmbeddedCheckoutComptableProps,
) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">
        Le paiement intégré n&apos;est plus disponible. Utilisez la page conférence pour
        souscrire.
      </p>
      <Button asChild>
        <Link href={CONFERENCE_INSCRIPTION_PATH}>Aller à la souscription</Link>
      </Button>
    </div>
  );
}
