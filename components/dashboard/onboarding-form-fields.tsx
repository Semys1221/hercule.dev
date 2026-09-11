"use client";

import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardData, DashboardFormData } from "@/lib/dashboard/types";

import { RetractionWaiverFields } from "./retraction-waiver-fields";

export const CGV_VERSION = "2026-09-09";

export type OnboardingFormFieldsProps = {
  mode: "live" | "preview";
  slug?: string;
  data: DashboardData;
  onSuccess?: () => void;
  idPrefix?: string;
};

export function OnboardingFormFields({
  mode,
  slug,
  data,
  onSuccess,
  idPrefix = "of",
}: OnboardingFormFieldsProps) {
  const [specialites, setSpecialites] = useState(
    (data.form.specialites ?? []).join(", "),
  );
  const [zone, setZone] = useState(data.form.zone ?? "");
  const [capacite, setCapacite] = useState(String(data.form.capacite ?? 2));
  const [budgetMinPonctuel, setBudgetMinPonctuel] = useState(
    String(data.form.budgetMinPonctuel ?? ""),
  );
  const [budgetMinMensuel, setBudgetMinMensuel] = useState(
    String(data.form.budgetMinMensuel ?? ""),
  );
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [waiveRetraction, setWaiveRetraction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreview = mode === "preview";
  const fieldId = (suffix: string) => `${idPrefix}-${suffix}`;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPreview) {
      return;
    }

    const root = rootRef.current;
    const inputCount = root?.querySelectorAll("input").length ?? 0;
    const labelCount = root?.querySelectorAll("label").length ?? 0;
    const contentHeight = root?.scrollHeight ?? 0;

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "c39d02",
      },
      body: JSON.stringify({
        sessionId: "c39d02",
        runId: "pre-fix",
        hypothesisId: "A,D",
        location: "onboarding-form-fields.tsx:preview",
        message: "agence preview form metrics",
        data: {
          component: "OnboardingFormFields",
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
  }, [isPreview, mode, data.form]);

  async function handleSubmit() {
    if (isPreview) return;

    if (!cgvAccepted) {
      setError("Veuillez accepter les CGV pour continuer.");
      return;
    }
    if (!specialites.trim()) {
      setError("Veuillez indiquer au moins une spécialité.");
      return;
    }
    if (!zone.trim()) {
      setError("Veuillez indiquer votre zone d'intervention.");
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
        .map((v) => v.trim())
        .filter(Boolean),
      zone: zone.trim(),
      capacite: Number(capacite) || 2,
      budgetMinPonctuel: budgetMinPonctuel ? Number(budgetMinPonctuel) : undefined,
      budgetMinMensuel: budgetMinMensuel ? Number(budgetMinMensuel) : undefined,
    };

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          tieDownAccepted: true,
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
          <h2 className="text-lg font-medium">Onboarding — aperçu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre profil agence tel qu&apos;il sera configuré.
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
            Spécialités <span className="text-destructive">*</span>
          </Label>
          <Input
            id={fieldId("specialites")}
            placeholder="SEO, Paid, Branding, Développement…"
            value={specialites}
            onChange={(e) => setSpecialites(e.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
          <p className="text-xs text-muted-foreground">Séparées par des virgules.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("zone")}>
            Zone d&apos;intervention <span className="text-destructive">*</span>
          </Label>
          <Input
            id={fieldId("zone")}
            placeholder="France entière, IDF, Lyon…"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId("capacite")}>Capacité mensuelle (projets simultanés)</Label>
          <Input
            id={fieldId("capacite")}
            type="number"
            min={1}
            step={1}
            placeholder="2"
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            disabled={isPreview}
            readOnly={isPreview}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("budget-ponctuel")}>Budget min. ponctuel (€)</Label>
            <Input
              id={fieldId("budget-ponctuel")}
              type="number"
              min={1500}
              step={250}
              placeholder="1 500"
              value={budgetMinPonctuel}
              onChange={(e) => setBudgetMinPonctuel(e.target.value)}
              disabled={isPreview}
              readOnly={isPreview}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("budget-mensuel")}>Budget min. retainer (€/mois)</Label>
            <Input
              id={fieldId("budget-mensuel")}
              type="number"
              min={1500}
              step={250}
              placeholder="1 500"
              value={budgetMinMensuel}
              onChange={(e) => setBudgetMinMensuel(e.target.value)}
              disabled={isPreview}
              readOnly={isPreview}
            />
          </div>
        </div>

        <Alert>
          <CalendarIcon className="size-4" />
          <AlertDescription>
            Une invitation Calendly vous sera envoyée pour connecter votre calendrier.
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
                  href="/cvg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Conditions Générales de Vente de Hercule
                </a>{" "}
                (version du {CGV_VERSION}) et confirme agir en tant que professionnel.
              </Label>
            </div>
          </div>

          <RetractionWaiverFields
            idPrefix={idPrefix}
            checked={waiveRetraction}
            onCheckedChange={setWaiveRetraction}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Démarrer mon onboarding"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
