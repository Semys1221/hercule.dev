"use client";

import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import type { DashboardData, DashboardFormData } from "@/lib/dashboard/types";

import { CGV_VERSION } from "./onboarding-form-fields";
import { RetractionWaiverFields } from "./retraction-waiver-fields";

const FACTURATION_OPTIONS = [
  { value: "monthly_12", label: "Mensualisé (12 acomptes)" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "annual", label: "Annuel" },
  { value: "variable", label: "Selon le dossier" },
] as const;

const SOCIAL_PAIE_OPTIONS = [
  { value: "included", label: "Inclus dans la lettre de mission de tenue" },
  { value: "separate", label: "Facturé à part (forfait annuel social / paie)" },
  { value: "not_offered", label: "Non proposé" },
] as const;

const DEFAULT_HONORAIRES_ANNUELS_MIN = Math.round(
  COMMERCIAL_COMPTABLE.honorairesAnnuelsMinCents / 100,
);
const DEFAULT_HONORAIRES_PONCTUEL_MIN = Math.round(
  COMMERCIAL_COMPTABLE.honorairesPonctuelMinCents / 100,
);

export type ComptableOnboardingFormFieldsProps = {
  mode: "live" | "preview";
  slug?: string;
  data: DashboardData;
  onSuccess?: () => void;
  idPrefix?: string;
};

export function ComptableOnboardingFormFields({
  mode,
  slug,
  data,
  onSuccess,
  idPrefix = "cof",
}: ComptableOnboardingFormFieldsProps) {
  const [specialites, setSpecialites] = useState(
    (data.form.specialites ?? []).join(", "),
  );
  const [capacite, setCapacite] = useState(String(data.form.capacite ?? 1));
  const [honorairesAnnuelsMin, setHonorairesAnnuelsMin] = useState(
    String(data.form.honorairesAnnuelsMin ?? DEFAULT_HONORAIRES_ANNUELS_MIN),
  );
  const [facturationMode, setFacturationMode] = useState(
    data.form.facturationMode ?? "monthly_12",
  );
  const [socialPaieMode, setSocialPaieMode] = useState(
    data.form.socialPaieMode ?? "included",
  );
  const [honorairesPonctuelMin, setHonorairesPonctuelMin] = useState(
    String(data.form.honorairesPonctuelMin ?? DEFAULT_HONORAIRES_PONCTUEL_MIN),
  );
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [waiveRetraction, setWaiveRetraction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreview = mode === "preview";
  const fieldId = (suffix: string) => `${idPrefix}-${suffix}`;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const inputCount = root?.querySelectorAll("input, button[role='combobox']").length ?? 0;
    const labelCount = root?.querySelectorAll("label").length ?? 0;
    const contentHeight = root?.scrollHeight ?? 0;

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "983675",
      },
      body: JSON.stringify({
        sessionId: "983675",
        runId: "post-fix",
        hypothesisId: "A,B",
        location: "comptable-onboarding-form-fields.tsx:mount",
        message: "comptable form fields metrics",
        data: {
          component: "ComptableOnboardingFormFields",
          mode,
          inputCount,
          labelCount,
          contentHeight,
          formFieldKeys: Object.keys(data.form ?? {}),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [mode, data.form]);

  async function handleSubmit() {
    if (isPreview) return;

    if (!cgvAccepted) {
      setError("Veuillez accepter les CGV pour continuer.");
      return;
    }
    if (!specialites.trim()) {
      setError("Veuillez indiquer au moins une mission.");
      return;
    }
    if (!slug) {
      setError("Identifiant client manquant.");
      return;
    }

    setSaving(true);
    setError(null);

    const form: DashboardFormData = {
      specialites: specialites
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      capacite: Number(capacite) || 1,
      honorairesAnnuelsMin: Number(honorairesAnnuelsMin) || DEFAULT_HONORAIRES_ANNUELS_MIN,
      facturationMode,
      socialPaieMode,
      honorairesPonctuelMin: honorairesPonctuelMin
        ? Number(honorairesPonctuelMin)
        : undefined,
    };

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          completeOnboarding: true,
          cgvVersion: CGV_VERSION,
          waiveRetraction,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Enregistrement impossible");
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-4 py-2">
      {isPreview ? (
        <div>
          <h2 className="text-lg font-medium">Onboarding cabinet — aperçu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre profil cabinet tel qu&apos;il sera configuré après activation.
          </p>
        </div>
      ) : null}

      <div
        className={
          isPreview
            ? "pointer-events-none flex flex-col gap-4 opacity-60"
            : "flex flex-col gap-4"
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("specialites")}>
            Missions du cabinet <span className="text-destructive">*</span>
          </Label>
          <Input
            id={fieldId("specialites")}
            placeholder="Tenue comptable TPE, Social / paie, Fiscalité…"
            value={specialites}
            onChange={(event) => setSpecialites(event.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
          <p className="text-xs text-muted-foreground">Séparées par des virgules.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("capacite")}>
            Capacité Hercule (dossiers / mois)
          </Label>
          <Input
            id={fieldId("capacite")}
            type="number"
            min={1}
            step={1}
            placeholder="1"
            value={capacite}
            onChange={(event) => setCapacite(event.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("honoraires-annuels")}>
            Honoraires annuels min. (€ / an)
          </Label>
          <Input
            id={fieldId("honoraires-annuels")}
            type="number"
            min={DEFAULT_HONORAIRES_ANNUELS_MIN}
            step={100}
            placeholder={String(DEFAULT_HONORAIRES_ANNUELS_MIN)}
            value={honorairesAnnuelsMin}
            onChange={(event) => setHonorairesAnnuelsMin(event.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("facturation")}>Modalité de facturation</Label>
            <Select
              value={facturationMode}
              onValueChange={setFacturationMode}
              disabled={isPreview}
            >
              <SelectTrigger id={fieldId("facturation")} className="w-full">
                <SelectValue placeholder="Choisir une modalité" />
              </SelectTrigger>
              <SelectContent>
                {FACTURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("social-paie")}>Social / paie</Label>
            <Select
              value={socialPaieMode}
              onValueChange={setSocialPaieMode}
              disabled={isPreview}
            >
              <SelectTrigger id={fieldId("social-paie")} className="w-full">
                <SelectValue placeholder="Choisir une option" />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PAIE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("honoraires-ponctuel")}>
            Honoraires ponctuels min. (€)
          </Label>
          <Input
            id={fieldId("honoraires-ponctuel")}
            type="number"
            min={DEFAULT_HONORAIRES_PONCTUEL_MIN}
            step={100}
            placeholder={String(DEFAULT_HONORAIRES_PONCTUEL_MIN)}
            value={honorairesPonctuelMin}
            onChange={(event) => setHonorairesPonctuelMin(event.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
        </div>

        <Alert>
          <CalendarIcon className="size-4" />
          <AlertDescription>
            Calendly Pro et Zoom Pro vous seront provisionnés pour planifier vos rendez-vous PME.
          </AlertDescription>
        </Alert>
      </div>

      {!isPreview ? (
        <>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id={fieldId("cgv")}
                checked={cgvAccepted}
                onCheckedChange={(checked) => setCgvAccepted(checked === true)}
              />
              <Label
                htmlFor={fieldId("cgv")}
                className="cursor-pointer text-sm leading-snug font-normal"
              >
                J&apos;accepte les{" "}
                <a
                  href="/cvg/comptable"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Conditions Générales de Vente de Hercule Comptable
                </a>{" "}
                (version du {CGV_VERSION}) et confirme agir en tant que professionnel.
              </Label>
            </div>
          </div>

          <RetractionWaiverFields
            idPrefix={idPrefix}
            cvgHref="/cvg/comptable"
            checked={waiveRetraction}
            onCheckedChange={setWaiveRetraction}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            className="w-full"
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Confirmer l'onboarding"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
