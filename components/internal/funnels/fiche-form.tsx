"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Audience } from "@/lib/admin/navigation";
import { AUDIENCE_LABELS } from "@/lib/admin/navigation";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

type FicheFormProps = {
  audience: Audience;
};

export function FicheForm({ audience }: FicheFormProps) {
  const label = AUDIENCE_LABELS[audience];
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [company, setCompany] = useState("");
  const [besoin, setBesoin] = useState("");
  const [specialites, setSpecialites] = useState("");
  const [tailleEquipe, setTailleEquipe] = useState("");
  const [budget, setBudget] = useState("");
  const [zone, setZone] = useState("");
  const [taille, setTaille] = useState("");
  const [droitRetractation, setDroitRetractation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRow, setCreatedRow] = useState<LinkTrackingLead | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCreatedRow(null);

    const payload =
      audience === "agence"
        ? {
            email,
            first_name: firstName,
            company,
            besoin,
            specialites: specialites
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            taille_equipe: tailleEquipe,
            budget,
            droit_retractation: droitRetractation,
          }
        : {
            email,
            first_name: firstName,
            company,
            besoin,
            budget,
            zone,
            taille,
          };

    try {
      const response = await fetch(`/api/admin/onboarding/${audience}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        row?: LinkTrackingLead;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Erreur lors de la création");
      }

      setCreatedRow(body.row ?? null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erreur lors de la création",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Créer une fiche {label}</h2>
        <p className="text-sm text-muted-foreground">
          Crée une fiche réelle en base (<code>agence</code> ou <code>entreprise</code>)
          — distincte des cartes mockup carousel.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="first-name">Prénom *</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Société *</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="besoin">Besoin *</Label>
          <Textarea
            id="besoin"
            value={besoin}
            onChange={(e) => setBesoin(e.target.value)}
            required
          />
        </div>

        {audience === "agence" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="specialites">Spécialités (séparées par des virgules)</Label>
              <Input
                id="specialites"
                value={specialites}
                onChange={(e) => setSpecialites(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taille-equipe">Taille équipe</Label>
                <Input
                  id="taille-equipe"
                  value={tailleEquipe}
                  onChange={(e) => setTailleEquipe(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-agence">Budget</Label>
                <Input
                  id="budget-agence"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="droit-retractation"
                checked={droitRetractation}
                onCheckedChange={(checked) => setDroitRetractation(checked === true)}
              />
              <Label htmlFor="droit-retractation">Droit de rétractation (4 jours)</Label>
            </div>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="budget-entreprise">Budget</Label>
              <Input
                id="budget-entreprise"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taille">Taille</Label>
              <Input id="taille" value={taille} onChange={(e) => setTaille(e.target.value)} />
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {createdRow ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            Fiche {label} créée — id <code>{createdRow.id}</code>, slug{" "}
            <code>{createdRow.slug}</code>.
          </div>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Création…" : "Créer la fiche"}
        </Button>

        {createdRow ? (
          <details className="rounded-md border p-4 text-sm">
            <summary className="cursor-pointer font-medium">Aperçu ligne créée</summary>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(createdRow, null, 2)}
            </pre>
          </details>
        ) : null}
      </form>
    </div>
  );
}
