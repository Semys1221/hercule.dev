"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  conferenceOfferLabel,
  CONFERENCE_CLIENT_TYPES,
} from "@/lib/commercial/conference-pricing";
import type { ClientDashboardData } from "@/lib/clients/types";

type ClientOnboardingRecapProps = {
  data: ClientDashboardData;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  onContinue: () => void;
  paidConfirmed?: boolean;
};

function verticalLabel(data: ClientDashboardData): string {
  if (data.secondaryVertical === "ias") {
    return "Hercule Hubris (CIF + IAS)";
  }
  if (data.clientType === CONFERENCE_CLIENT_TYPES.dec) {
    return "DEC — Expert-Comptable (Mercantile)";
  }
  if (data.clientType === CONFERENCE_CLIENT_TYPES.cif) {
    return "CIF — Conseiller Financier (Hubris)";
  }
  return "IAS — Courtier assurance (Hubris)";
}

function billingLabel(billing: ClientDashboardData["billing"]): string {
  return billing === "monthly" ? "Mensuel (abonnement)" : "Pack (paiement unique)";
}

export function ClientOnboardingRecap({
  data,
  firstName,
  onFirstNameChange,
  onContinue,
  paidConfirmed,
}: ClientOnboardingRecapProps) {
  const canContinue = firstName.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{data.dashboardTitle}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Bienvenue{firstName.trim() ? `, ${firstName.trim()}` : " chez Hercule"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vérifiez vos paramètres. Ils sont fixés selon votre formule — seule la
          confirmation du prénom est requise pour continuer.
        </p>
        {paidConfirmed ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Paiement confirmé — complétez votre profil pour continuer.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="onboarding-first-name">Prénom</Label>
          <Input
            id="onboarding-first-name"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            placeholder="Votre prénom"
            autoComplete="given-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-email">Email</Label>
          <Input id="onboarding-email" value={data.email} readOnly disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-vertical">Verticale</Label>
          <Input
            id="onboarding-vertical"
            value={verticalLabel(data)}
            readOnly
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-offer">Formule</Label>
          <Input
            id="onboarding-offer"
            value={conferenceOfferLabel(data.offerType)}
            readOnly
            disabled
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="onboarding-billing">Facturation</Label>
            <Input
              id="onboarding-billing"
              value={billingLabel(data.billing)}
              readOnly
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-credits">Crédits RDV</Label>
            <Input
              id="onboarding-credits"
              value={String(data.rdvTotal)}
              readOnly
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-calendly">Calendly</Label>
          <Input
            id="onboarding-calendly"
            value="Lien d'invitation sous 24 h — regardez vos mails"
            readOnly
            disabled
          />
          <p className="text-xs text-muted-foreground">
            L&apos;invitation Calendly Pro sera envoyée à {data.email} sous 24
            heures.
          </p>
        </div>
      </div>

      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continuer
      </Button>
    </div>
  );
}
