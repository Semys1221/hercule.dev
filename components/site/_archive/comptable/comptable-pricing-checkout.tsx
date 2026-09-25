"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CONFERENCE_INSCRIPTION_PATH } from "@/lib/legacy/payments/cabinet-checkout";
import { cn } from "@/lib/utils";

export type ComptablePricingCheckoutProps = {
  slug?: string;
  variant?: "sales" | "dashboard";
  ctaLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function ComptablePricingCheckout({
  className,
  disabled = false,
  ctaLabel = "Voir les offres conférence",
}: ComptablePricingCheckoutProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground">
        Les souscriptions passent par la page conférence (DEC, CIF, IAS) et le paiement
        sécurisé Stripe.
      </p>
      <Button asChild disabled={disabled}>
        <Link href={CONFERENCE_INSCRIPTION_PATH}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
