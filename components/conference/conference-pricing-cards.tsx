"use client";

import { useState } from "react";

import { SceneLabel } from "@/components/conference/shared/SceneLabel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CONFERENCE_CLIENT_TYPES,
  CONFERENCE_VERTICAL_COPY,
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
};

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="flex w-full flex-col gap-2 text-xs tracking-widest text-zinc-500 uppercase">
      {items.map((item) => (
        <li key={item} className="flex items-center justify-center gap-2">
          <span className="size-1 shrink-0 bg-zinc-500" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function VerticalAnnouncement({ announcement }: { announcement: string }) {
  return (
    <p className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/50 px-4 py-3 text-left text-sm leading-relaxed text-zinc-400">
      {announcement}
    </p>
  );
}

function VerticalCheckboxRow({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex w-full items-start gap-3 text-left">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange?.(value === true)}
        aria-readonly={disabled ? true : undefined}
      />
      <Label
        htmlFor={id}
        className={cn(
          "text-sm leading-snug text-zinc-300",
          disabled && "cursor-default opacity-80",
        )}
      >
        {label}
      </Label>
    </div>
  );
}

function CheckoutActions({
  disabled,
  disabledReason,
  onMonthly,
  onPack,
}: {
  disabled: boolean;
  disabledReason?: string;
  onMonthly: () => void;
  onPack: () => void;
}) {
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <Button
        type="button"
        className="w-full"
        disabled={disabled}
        onClick={onMonthly}
        aria-disabled={disabled}
      >
        Abonnement sans engagement
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full border-zinc-600 bg-transparent text-zinc-200 hover:bg-zinc-800/60"
        disabled={disabled}
        onClick={onPack}
        aria-disabled={disabled}
      >
        Pack sans abonnement
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
}: {
  variant: "static" | "checkout";
  onCheckout?: (input: ConferenceCheckoutSelection) => void;
}) {
  const decCopy = CONFERENCE_VERTICAL_COPY.dec;
  const isCheckout = variant === "checkout";

  return (
    <div className={CONFERENCE_CARD_CLASS}>
      <SceneLabel size="md" animate={false}>HERCULE DEC</SceneLabel>
      <p className="text-5xl font-thin text-zinc-100">1 499 €</p>
      <p className="text-sm text-zinc-500">/ mois · 10 RDV</p>
      <p className="text-xl text-zinc-400">3 000 € / 3 mois</p>
      <p className="text-sm text-zinc-500">30 RDV · pack sans abonnement</p>
      <div className="mt-1 h-px w-full bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

      {isCheckout ? (
        <div className="flex w-full flex-col gap-3">
          <VerticalCheckboxRow
            id="conference-dec-vertical"
            label={decCopy.checkboxLabel}
            checked
            disabled
          />
          <VerticalAnnouncement announcement={decCopy.announcement} />
          <CheckoutActions
            disabled={false}
            onMonthly={() =>
              onCheckout?.({
                card: "dec",
                billing: "monthly",
                selections: { cif: false, ias: false },
                clientType: CONFERENCE_CLIENT_TYPES.dec,
              })
            }
            onPack={() =>
              onCheckout?.({
                card: "dec",
                billing: "pack",
                selections: { cif: false, ias: false },
                clientType: CONFERENCE_CLIENT_TYPES.dec,
              })
            }
          />
        </div>
      ) : (
        <FeatureList
          items={[
            "10 restaurants / mois",
            "3 signatures visées",
            "Rétractation 4 jours",
          ]}
        />
      )}
    </div>
  );
}

function CourtageCard({
  variant,
  onCheckout,
}: {
  variant: "static" | "checkout";
  onCheckout?: (input: ConferenceCheckoutSelection) => void;
}) {
  const [selections, setSelections] = useState<ConferenceVerticalSelections>({
    cif: false,
    ias: false,
  });

  const isCheckout = variant === "checkout";
  const clientType = isCheckout
    ? resolveConferenceClientType({ card: "courtage", selections })
    : null;
  const checkoutDisabled = isCheckout && clientType === null;

  const activeVerticals = (
    [
      selections.cif ? CONFERENCE_CLIENT_TYPES.cif : null,
      selections.ias ? CONFERENCE_CLIENT_TYPES.ias : null,
    ] as const
  ).filter((value): value is ConferenceClientType => value !== null);

  return (
    <div className={CONFERENCE_CARD_CLASS}>
      <SceneLabel size="md" animate={false}>HERCULE COURTAGE</SceneLabel>
      <p className="text-5xl font-thin text-zinc-100">3 900 €</p>
      <p className="text-sm text-zinc-500">/ 3 mois · 25 RDV</p>
      <p className="text-xl text-zinc-400">1 800 € / mois</p>
      <p className="text-sm text-zinc-500">10 RDV · sans engagement</p>
      <div className="mt-1 h-px w-full bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

      {isCheckout ? (
        <div className="flex w-full flex-col gap-3">
          <VerticalCheckboxRow
            id="conference-cif-vertical"
            label={CONFERENCE_VERTICAL_COPY.cif.checkboxLabel}
            checked={selections.cif}
            onCheckedChange={(checked) =>
              setSelections((current) => ({ ...current, cif: checked }))
            }
          />
          <VerticalCheckboxRow
            id="conference-ias-vertical"
            label={CONFERENCE_VERTICAL_COPY.ias.checkboxLabel}
            checked={selections.ias}
            onCheckedChange={(checked) =>
              setSelections((current) => ({ ...current, ias: checked }))
            }
          />

          {activeVerticals.map((vertical) => (
            <VerticalAnnouncement
              key={vertical}
              announcement={CONFERENCE_VERTICAL_COPY[vertical].announcement}
            />
          ))}

          <CheckoutActions
            disabled={checkoutDisabled}
            disabledReason="Cochez CIF ou IAS pour continuer."
            onMonthly={() => {
              if (!clientType) return;
              onCheckout?.({
                card: "courtage",
                billing: "monthly",
                selections,
                clientType,
              });
            }}
            onPack={() => {
              if (!clientType) return;
              onCheckout?.({
                card: "courtage",
                billing: "pack",
                selections,
                clientType,
              });
            }}
          />
        </div>
      ) : (
        <FeatureList
          items={[
            "25 médecins qualifiés",
            "9 signatures visées",
            "Rétractation 4 jours",
          ]}
        />
      )}
    </div>
  );
}

export function ConferencePricingCards({
  variant,
  className,
  onCheckout,
}: ConferencePricingCardsProps) {
  return (
    <div className={cn("grid w-full grid-cols-1 gap-6 md:grid-cols-2", className)}>
      <DecCard variant={variant} onCheckout={onCheckout} />
      <CourtageCard variant={variant} onCheckout={onCheckout} />
    </div>
  );
}
