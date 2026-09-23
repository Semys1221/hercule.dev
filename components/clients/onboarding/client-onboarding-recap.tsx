"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { guaranteeMonthsLabel } from "@/lib/clients/cgv-onboarding";
import {
  conferenceOfferLabel,
  CONFERENCE_CLIENT_TYPES,
} from "@/lib/commercial/conference-pricing";
import type { ClientDashboardData } from "@/lib/clients/types";
import {
  CLIENT_VIDEO_CONFERENCE_OPTIONS,
  type ClientVideoConference,
  videoConferenceDescription,
  videoConferenceLabel,
} from "@/lib/clients/video-conference";

type ClientOnboardingRecapProps = {
  data: ClientDashboardData;
  firstName: string;
  videoConference: ClientVideoConference | null;
  unavailability: string;
  startNow: boolean | null;
  onFirstNameChange: (value: string) => void;
  onVideoConferenceChange: (value: ClientVideoConference) => void;
  onUnavailabilityChange: (value: string) => void;
  onStartNowChange: (value: boolean) => void;
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
  videoConference,
  unavailability,
  startNow,
  onFirstNameChange,
  onVideoConferenceChange,
  onUnavailabilityChange,
  onStartNowChange,
  onContinue,
  paidConfirmed,
}: ClientOnboardingRecapProps) {
  const months = guaranteeMonthsLabel(data.billing);
  const canContinue =
    firstName.trim().length > 0 &&
    videoConference !== null &&
    unavailability.trim().length > 0 &&
    startNow !== null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{data.dashboardTitle}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Bienvenue{firstName.trim() ? `, ${firstName.trim()}` : " chez Hercule"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quelques réponses, et on vous montre les conditions juste après.
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

        <div className="space-y-3">
          <Label>Visioconférence</Label>
          <RadioGroup
            value={videoConference ?? undefined}
            onValueChange={(value) =>
              onVideoConferenceChange(value as ClientVideoConference)
            }
            className="gap-3"
          >
            {CLIENT_VIDEO_CONFERENCE_OPTIONS.map((option) => {
              const inputId = `onboarding-visio-${option}`;
              return (
                <div key={option} className="flex items-start gap-3">
                  <RadioGroupItem
                    value={option}
                    id={inputId}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={inputId} className="font-medium">
                      {videoConferenceLabel(option)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {videoConferenceDescription(option)}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
          {videoConference === "zoom_pro" ? (
            <p className="text-xs text-muted-foreground">
              Votre compte Zoom Pro sera provisionné sous 24 heures à{" "}
              {data.email}.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-unavailability">
            Avez-vous des indisponibilités ?
          </Label>
          <Textarea
            id="onboarding-unavailability"
            value={unavailability}
            onChange={(event) => onUnavailabilityChange(event.target.value)}
            placeholder="Aucune, ou les créneaux à éviter"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <Label id="onboarding-start-now-label">
              Souhaitez-vous démarrer votre service maintenant ?
            </Label>
            <p className="text-sm text-muted-foreground">
              Vous passerez d&apos;une rétractation à une garantie de {months} de
              service offert.
            </p>
          </div>
          <RadioGroup
            value={startNow === null ? undefined : startNow ? "yes" : "no"}
            onValueChange={(value) => onStartNowChange(value === "yes")}
            aria-labelledby="onboarding-start-now-label"
            className="gap-3"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="yes" id="onboarding-start-yes" className="mt-0.5" />
              <Label htmlFor="onboarding-start-yes" className="font-medium">
                Oui, je démarre maintenant
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="no" id="onboarding-start-no" className="mt-0.5" />
              <Label htmlFor="onboarding-start-no" className="font-medium">
                Non, je garde mes 4 jours
              </Label>
            </div>
          </RadioGroup>
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
