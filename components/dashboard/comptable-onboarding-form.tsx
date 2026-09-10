"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DashboardData } from "@/lib/dashboard/types";

import { CGV_VERSION } from "./onboarding-form-fields";
import { RetractionWaiverFields } from "./retraction-waiver-fields";

type ComptableOnboardingFormProps = {
  data: DashboardData;
  onSuccess?: () => void;
};

export function ComptableOnboardingForm({ data, onSuccess }: ComptableOnboardingFormProps) {
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [waiveRetraction, setWaiveRetraction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!cgvAccepted) {
      setError("Veuillez accepter les CGV pour continuer.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(data.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="comptable-cgv"
            checked={cgvAccepted}
            onCheckedChange={(checked) => setCgvAccepted(checked === true)}
          />
          <Label htmlFor="comptable-cgv" className="cursor-pointer text-sm leading-snug font-normal">
            J&apos;accepte les{" "}
            <a
              href="/cvg/comptable"
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
        idPrefix="comptable"
        cvgHref="/cvg/comptable"
        checked={waiveRetraction}
        onCheckedChange={setWaiveRetraction}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="button" className="w-full" onClick={() => void handleSubmit()} disabled={saving}>
        {saving ? "Enregistrement…" : "Confirmer l'onboarding"}
      </Button>
    </div>
  );
}
