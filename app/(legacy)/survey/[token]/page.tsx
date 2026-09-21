"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SurveyPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [audience, setAudience] = useState<"agence" | "entreprise" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saleMade, setSaleMade] = useState<"yes" | "no">("no");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/survey/${token}`)
      .then(async (response) => {
        const body = (await response.json()) as { audience?: "agence" | "entreprise"; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Lien invalide");
        if (!cancelled) setAudience(body.audience ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/survey/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          audience === "agence" ? { saleMade: saleMade === "yes" } : {},
        ),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Envoi impossible");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Questionnaire post-rendez-vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {done ? (
            <p className="text-sm">Merci, votre retour a bien été enregistré.</p>
          ) : audience === "agence" ? (
            <div className="space-y-4">
              <p className="text-sm">Avez-vous conclu une vente suite au rendez-vous ?</p>
              <RadioGroup
                value={saleMade}
                onValueChange={(value) => setSaleMade(value as "yes" | "no")}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sale-yes" value="yes" />
                  <Label htmlFor="sale-yes">Oui</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="sale-no" value="no" />
                  <Label htmlFor="sale-no">Non</Label>
                </div>
              </RadioGroup>
              <Button type="button" onClick={() => void submit()} disabled={saving}>
                {saving ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          ) : audience === "entreprise" ? (
            <div className="space-y-4">
              <p className="text-sm">
                Merci de confirmer que vous avez bien échangé avec l&apos;agence.
              </p>
              <Button type="button" onClick={() => void submit()} disabled={saving}>
                {saving ? "Envoi…" : "Confirmer"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
