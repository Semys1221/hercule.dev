"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardData, DashboardFormData } from "@/lib/dashboard/types";

import { RetractionWaiverFields } from "../retraction-waiver-fields";

type StepOnboardingFormProps = {
  slug: string;
  data: DashboardData;
  onSaved: () => void;
};

export function StepOnboardingForm({ slug, data, onSaved }: StepOnboardingFormProps) {
  const [specialites, setSpecialites] = useState(
    (data.form.specialites ?? []).join(", "),
  );
  const [zone, setZone] = useState(data.form.zone ?? "");
  const [capacite, setCapacite] = useState(String(data.form.capacite ?? 2));
  const [tieDown, setTieDown] = useState(data.tieDownAccepted);
  const [waiveRetraction, setWaiveRetraction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!tieDown) {
      setError("Veuillez accepter les règles de traitement.");
      return;
    }

    setSaving(true);
    setError(null);

    const form: DashboardFormData = {
      specialites: specialites
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      zone: zone.trim(),
      capacite: Number(capacite) || 2,
    };

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          tieDownAccepted: true,
          completeOnboarding: true,
          waiveRetraction,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Enregistrement impossible");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Onboarding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complétez votre fiche pour lancer la préparation.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialites">Spécialités (séparées par des virgules)</Label>
        <Input
          id="specialites"
          placeholder="SEO, Paid, Branding…"
          value={specialites}
          onChange={(event) => setSpecialites(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="zone">Zone d&apos;intervention</Label>
        <Input
          id="zone"
          placeholder="France, IDF…"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacite">Capacité mensuelle (projets)</Label>
        <Input
          id="capacite"
          type="number"
          min={1}
          step={1}
          value={capacite}
          onChange={(event) => setCapacite(event.target.value)}
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="tieDown"
          checked={tieDown}
          onCheckedChange={(checked) => setTieDown(checked === true)}
        />
        <Label htmlFor="tieDown" className="text-sm leading-snug font-normal">
          J&apos;accepte les règles de traitement Hercule
        </Label>
      </div>

      <RetractionWaiverFields
        idPrefix="step-onboarding"
        checked={waiveRetraction}
        onCheckedChange={setWaiveRetraction}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
