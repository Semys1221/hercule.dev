"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { AgenceCheckoutOfferType } from "@/lib/commercial/constants";
import { CONFERENCE_INSCRIPTION_PATH } from "@/lib/legacy/payments/cabinet-checkout";

type StepEmbeddedCheckoutProps = {
  slug?: string;
  offerType?: AgenceCheckoutOfferType;
  fast?: boolean;
  clientSecret?: string | null;
  preloadError?: string | null;
};

export function StepEmbeddedCheckout(_props: StepEmbeddedCheckoutProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">
        Le paiement agence intégré n&apos;est plus disponible. Les offres actives sont sur la
        page conférence.
      </p>
      <Button asChild>
        <Link href={CONFERENCE_INSCRIPTION_PATH}>Voir les offres</Link>
      </Button>
    </div>
  );
}
