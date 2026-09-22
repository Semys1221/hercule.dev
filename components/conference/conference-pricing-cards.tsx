"use client";

import { useState } from "react";

import { SceneLabel } from "@/components/conference/shared/SceneLabel";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CONFERENCE_BILLING,
  CONFERENCE_CLIENT_TYPES,
  type ConferenceBilling,
  type ConferenceCard,
  type ConferenceClientType,
  type ConferenceVerticalSelections,
  resolveConferenceClientType,
} from "@/lib/commercial/conference-pricing";
import { cn } from "@/lib/utils";

export const CONFERENCE_CARD_CLASS =
  "flex flex-col items-center gap-3 rounded-xl border border-zinc-600/50 bg-gradient-to-b from-zinc-800/30 to-zinc-900/70 px-8 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

export type ConferenceCheckoutSelection = {
  card: ConferenceCard;
  billing: ConferenceBilling;
  selections: ConferenceVerticalSelections;
  clientType: ConferenceClientType;
};

export type ConferencePricingCardsProps = {
  variant: "static" | "checkout";
  className?: string;
  onCheckout?: (input: ConferenceCheckoutSelection) => void;
  checkoutOpen?: boolean;
  checkoutDisabledReason?: string;
  decTaken?: number;
  courtageTaken?: number;
};

type OfferDisplay = {
  price: string;
  period: string;
  guarantee: string;
  billing: ConferenceBilling;
};

const DEC_OFFERS: Record<"monthly" | "pack", OfferDisplay> = {
  monthly: {
    price: "1 499 €",
    period: "— 1 mois",
    guarantee: "10 rendez-vous qualifiés ou 1 mois de service offert.",
    billing: CONFERENCE_BILLING.monthly,
  },
  pack: {
    price: "3 000 €",
    period: "— 3 mois",
    guarantee: "10 rendez-vous qualifiés ou 1 mois de service offert.",
    billing: CONFERENCE_BILLING.pack,
  },
};

const COURTAGE_OFFERS: Record<"monthly" | "pack", OfferDisplay> = {
  pack: {
    price: "3 900 €",
    period: "/ 3 mois",
    guarantee: "25 rendez-vous qualifiés ou 3 mois de service offert.",
    billing: CONFERENCE_BILLING.pack,
  },
  monthly: {
    price: "1 800 €",
    period: "/ mois",
    guarantee: "25 rendez-vous qualifiés ou 3 mois de service offert.",
    billing: CONFERENCE_BILLING.monthly,
  },
};

function SeatQuota({ taken }: { taken: number }) {
  return (
    <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
      {taken} / 4
    </p>
  );
}

function GuaranteeLine({ text }: { text: string }) {
  return (
    <p className="max-w-xs text-center text-sm leading-relaxed text-zinc-400">
      {text}
    </p>
  );
}

function BillingToggleLink({
  billing,
  onSelectMonthly,
  onSelectPack,
}: {
  billing: ConferenceBilling;
  onSelectMonthly: () => void;
  onSelectPack: () => void;
}) {
  if (billing === CONFERENCE_BILLING.monthly) {
    return (
      <button
        type="button"
        className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
        onClick={onSelectPack}
      >
        Obtenir une réduction 3 mois
      </button>
    );
  }

  return (
    <button
      type="button"
      className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
      onClick={onSelectMonthly}
    >
      1 mois
    </button>
  );
}

function CourtageBillingToggleLink({
  billing,
  onSelectMonthly,
  onSelectPack,
}: {
  billing: ConferenceBilling;
  onSelectMonthly: () => void;
  onSelectPack: () => void;
}) {
  if (billing === CONFERENCE_BILLING.pack) {
    return (
      <button
        type="button"
        className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
        onClick={onSelectMonthly}
      >
        Essayez 1 mois
      </button>
    );
  }

  return (
    <button
      type="button"
      className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
      onClick={onSelectPack}
    >
      3 mois
    </button>
  );
}

function VerticalChoice({
  value,
  onChange,
}: {
  value: ConferenceClientType | null;
  onChange: (selections: ConferenceVerticalSelections) => void;
}) {
  const selected =
    value === CONFERENCE_CLIENT_TYPES.cif
      ? "cif"
      : value === CONFERENCE_CLIENT_TYPES.ias
        ? "ias"
        : "";

  return (
    <ToggleGroup
      type="single"
      value={selected}
      onValueChange={(next) => {
        if (next === "cif") {
          onChange({ cif: true, ias: false });
        } else if (next === "ias") {
          onChange({ cif: false, ias: true });
        }
      }}
      className="w-full"
    >
      <ToggleGroupItem
        value="cif"
        className="flex-1 border-zinc-600 data-[state=on]:bg-zinc-800"
      >
        CIF
      </ToggleGroupItem>
      <ToggleGroupItem
        value="ias"
        className="flex-1 border-zinc-600 data-[state=on]:bg-zinc-800"
      >
        IAS
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function CheckoutCta({
  disabled,
  disabledReason,
  onSubscribe,
}: {
  disabled: boolean;
  disabledReason?: string;
  onSubscribe: () => void;
}) {
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <Button
        type="button"
        className="w-full"
        disabled={disabled}
        onClick={onSubscribe}
        aria-disabled={disabled}
      >
        S&apos;inscrire
      </Button>
      {disabled && disabledReason ? (
        <p className="text-center text-xs text-zinc-500">{disabledReason}</p>
      ) : null}
    </div>
  );
}

function DecCard({
  variant,
  onCheckout,
  checkoutOpen,
  taken,
  windowClosedReason,
}: {
  variant: "static" | "checkout";
  onCheckout?: (input: ConferenceCheckoutSelection) => void;
  checkoutOpen: boolean;
  taken: number;
  windowClosedReason: string;
}) {
  const [billing, setBilling] = useState<ConferenceBilling>(
    CONFERENCE_BILLING.monthly,
  );
  const isCheckout = variant === "checkout";
  const offerKey = billing === CONFERENCE_BILLING.pack ? "pack" : "monthly";
  const offer = DEC_OFFERS[offerKey];
  const actionsDisabled = isCheckout && !checkoutOpen;

  return (
    <div className={CONFERENCE_CARD_CLASS}>
      <SceneLabel size="md" animate={false}>HERCULE DEC</SceneLabel>
      {variant === "checkout" ? <SeatQuota taken={taken} /> : null}
      <p className="text-5xl font-thin text-zinc-100">{offer.price}</p>
      <p className="text-sm text-zinc-500">{offer.period}</p>
      <GuaranteeLine text={offer.guarantee} />

      {isCheckout ? (
        <div className="flex w-full flex-col items-center gap-3">
          <BillingToggleLink
            billing={billing}
            onSelectMonthly={() => setBilling(CONFERENCE_BILLING.monthly)}
            onSelectPack={() => setBilling(CONFERENCE_BILLING.pack)}
          />
          <CheckoutCta
            disabled={actionsDisabled}
            disabledReason={windowClosedReason}
            onSubscribe={() =>
              onCheckout?.({
                card: "dec",
                billing: offer.billing,
                selections: { cif: false, ias: false },
                clientType: CONFERENCE_CLIENT_TYPES.dec,
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function CourtageCard({
  variant,
  onCheckout,
  checkoutOpen,
  taken,
  windowClosedReason,
}: {
  variant: "static" | "checkout";
  onCheckout?: (input: ConferenceCheckoutSelection) => void;
  checkoutOpen: boolean;
  taken: number;
  windowClosedReason: string;
}) {
  const [billing, setBilling] = useState<ConferenceBilling>(
    CONFERENCE_BILLING.pack,
  );
  const [selections, setSelections] = useState<ConferenceVerticalSelections>({
    cif: false,
    ias: false,
  });

  const isCheckout = variant === "checkout";
  const offerKey = billing === CONFERENCE_BILLING.pack ? "pack" : "monthly";
  const offer = COURTAGE_OFFERS[offerKey];
  const clientType = isCheckout
    ? resolveConferenceClientType({ card: "courtage", selections })
    : null;
  const checkoutDisabled =
    isCheckout && (clientType === null || !checkoutOpen);

  return (
    <div className={CONFERENCE_CARD_CLASS}>
      <SceneLabel size="md" animate={false}>HERCULE COURTAGE</SceneLabel>
      {variant === "checkout" ? <SeatQuota taken={taken} /> : null}
      <p className="text-5xl font-thin text-zinc-100">{offer.price}</p>
      <p className="text-sm text-zinc-500">{offer.period}</p>
      <GuaranteeLine text={offer.guarantee} />

      {isCheckout ? (
        <div className="flex w-full flex-col items-center gap-3">
          <VerticalChoice value={clientType} onChange={setSelections} />
          <CourtageBillingToggleLink
            billing={billing}
            onSelectMonthly={() => setBilling(CONFERENCE_BILLING.monthly)}
            onSelectPack={() => setBilling(CONFERENCE_BILLING.pack)}
          />
          <CheckoutCta
            disabled={checkoutDisabled}
            disabledReason={
              !checkoutOpen
                ? windowClosedReason
                : "Choisissez CIF ou IAS pour continuer."
            }
            onSubscribe={() => {
              if (!clientType) return;
              onCheckout?.({
                card: "courtage",
                billing: offer.billing,
                selections,
                clientType,
              });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ConferencePricingCards({
  variant,
  className,
  onCheckout,
  checkoutOpen = true,
  checkoutDisabledReason = "Les inscriptions sont closes.",
  decTaken = 0,
  courtageTaken = 0,
}: ConferencePricingCardsProps) {
  return (
    <div className={cn("grid w-full grid-cols-1 gap-6 md:grid-cols-2", className)}>
      <DecCard
        variant={variant}
        onCheckout={onCheckout}
        checkoutOpen={checkoutOpen}
        taken={decTaken}
        windowClosedReason={checkoutDisabledReason}
      />
      <CourtageCard
        variant={variant}
        onCheckout={onCheckout}
        checkoutOpen={checkoutOpen}
        taken={courtageTaken}
        windowClosedReason={checkoutDisabledReason}
      />
    </div>
  );
}
