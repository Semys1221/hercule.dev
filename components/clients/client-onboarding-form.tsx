"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientDashboardData } from "@/lib/clients/types";

type ClientOnboardingFormProps = {
  data: ClientDashboardData;
  onSuccess?: () => void;
};

export function ClientOnboardingForm({ data, onSuccess }: ClientOnboardingFormProps) {
  const [firstName, setFirstName] = useState(data.firstName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = firstName.trim();
    if (!trimmed) {
      setError("Indiquez votre prénom pour continuer.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(data.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmed,
          completeOnboarding: true,
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
      <div className="space-y-2">
        <Label htmlFor="client-first-name">Votre prénom</Label>
        <Input
          id="client-first-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Intel"
          autoComplete="given-name"
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
        {saving ? "Enregistrement…" : "Accéder à mon espace"}
      </Button>
    </div>
  );
}
