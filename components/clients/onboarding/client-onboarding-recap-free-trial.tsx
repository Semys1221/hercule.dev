"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isCalendlySchedulingUrl } from "@/lib/clients/dec-free-trial";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import type { ClientDashboardData } from "@/lib/clients/types";

const LOCKED_VISIO_OPTIONS = [
  { id: "calendly_pro", label: "Calendly Pro", hint: "Inclus après conversion" },
  { id: "zoom_pro", label: "Zoom Pro", hint: "Inclus après conversion" },
  { id: "google_meet_pro", label: "Google Meet Pro", hint: "Inclus après conversion" },
  { id: "microsoft_teams_pro", label: "Microsoft Teams Pro", hint: "Inclus après conversion" },
] as const;

type ClientOnboardingRecapFreeTrialProps = {
  data: ClientDashboardData;
  firstName: string;
  calendlyUrl: string;
  unavailability: string;
  onFirstNameChange: (value: string) => void;
  onCalendlyUrlChange: (value: string) => void;
  onUnavailabilityChange: (value: string) => void;
  onContinue: () => void;
  paidConfirmed?: boolean;
};

export function ClientOnboardingRecapFreeTrial({
  data,
  firstName,
  calendlyUrl,
  unavailability,
  onFirstNameChange,
  onCalendlyUrlChange,
  onUnavailabilityChange,
  onContinue,
  paidConfirmed,
}: ClientOnboardingRecapFreeTrialProps) {
  const canContinue =
    firstName.trim().length > 0 &&
    isCalendlySchedulingUrl(calendlyUrl) &&
    unavailability.trim().length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Essai DEC · 14 jours</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {paidConfirmed ? "Essai confirmé" : "Votre essai"}
          {firstName.trim() ? `, ${firstName.trim()}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un rendez-vous restaurant (rentabilité, budget cible 300 €). Ensuite
          1 499 €/mois pour 10 rendez-vous si vous poursuivez.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-ft-first-name">Prénom</Label>
          <Input
            id="onboarding-ft-first-name"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-ft-email">Email</Label>
          <Input id="onboarding-ft-email" value={data.email} readOnly disabled />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="onboarding-ft-offer">Formule</Label>
          <Input
            id="onboarding-ft-offer"
            value={conferenceOfferLabel(data.offerType)}
            readOnly
            disabled
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label>Outils provisionnés</Label>
          <p className="text-sm text-muted-foreground">
            Calendly Pro et Zoom Pro sont visibles mais réservés à la formule
            payante. Pendant l&apos;essai, donnez le lien de votre Calendly déjà
            relié à une visioconférence.
          </p>
        </div>
        <TooltipProvider>
          <RadioGroup className="gap-3">
            {LOCKED_VISIO_OPTIONS.map((option) => (
              <div key={option.id} className="flex items-start gap-3 opacity-60">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <RadioGroupItem
                        value={option.id}
                        id={`onboarding-ft-${option.id}`}
                        disabled
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{option.hint}</TooltipContent>
                </Tooltip>
                <Label htmlFor={`onboarding-ft-${option.id}`} className="font-medium">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </TooltipProvider>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-ft-calendly">Lien Calendly</Label>
        <Input
          id="onboarding-ft-calendly"
          value={calendlyUrl}
          onChange={(event) => onCalendlyUrlChange(event.target.value)}
          placeholder="https://calendly.com/votre-cabinet/rdv"
          inputMode="url"
        />
        <p className="text-xs text-muted-foreground">
          Le type d&apos;événement doit déjà inclure Zoom, Meet ou Teams.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="onboarding-ft-unavailability">
          Avez-vous des indisponibilités ?
        </Label>
        <Textarea
          id="onboarding-ft-unavailability"
          value={unavailability}
          onChange={(event) => onUnavailabilityChange(event.target.value)}
          placeholder="Aucune, ou les créneaux à éviter"
          rows={3}
        />
      </div>

      <Button type="button" className="w-full sm:w-auto" disabled={!canContinue} onClick={onContinue}>
        Continuer
      </Button>
    </div>
  );
}
