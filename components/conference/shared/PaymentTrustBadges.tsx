"use client";

import { COMMERCIAL } from "@/lib/commercial/constants";
import { cn } from "@/lib/utils";

import {
  ApplePayLogo,
  GooglePayLogo,
  KlarnaLogo,
  PayPalLogo,
  RefundShieldLogo,
  VisaLogo,
} from "./payment-logos";

type PaymentTrustBadgesProps = {
  className?: string;
};

const PAYMENT_LOGOS = [
  { id: "visa", Logo: VisaLogo, label: "Visa" },
  { id: "apple-pay", Logo: ApplePayLogo, label: "Apple Pay" },
  { id: "google-pay", Logo: GooglePayLogo, label: "Google Pay" },
  { id: "paypal", Logo: PayPalLogo, label: "PayPal" },
  { id: "klarna", Logo: KlarnaLogo, label: "Klarna" },
] as const;

const CHIP_CLASS =
  "flex h-10 items-center justify-center rounded-md border border-zinc-700/60 bg-zinc-900/40 px-3";

export function PaymentTrustBadges({ className }: PaymentTrustBadgesProps) {
  const retractionLabel = `${COMMERCIAL.retractationDays} jours de rétractation`;

  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="img"
      aria-label={`Moyens de paiement : Visa, Apple Pay, Google Pay, PayPal, Klarna. ${retractionLabel}.`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PAYMENT_LOGOS.map(({ id, Logo, label }) => (
          <div key={id} className={cn(CHIP_CLASS, "min-w-14")} title={label}>
            <Logo />
          </div>
        ))}
      </div>
      <div className={cn(CHIP_CLASS, "gap-2")}>
        <RefundShieldLogo />
        <span className="text-[10px] font-medium tracking-[0.16em] text-zinc-300 uppercase">
          {retractionLabel}
        </span>
      </div>
    </div>
  );
}
