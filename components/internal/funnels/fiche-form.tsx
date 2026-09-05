"use client";

import { useMemo, useState } from "react";

import { InternalJsonPreview } from "@/components/internal/funnels/ui/internal-json-preview";
import { InternalPreviewJsonSheet } from "@/components/internal/funnels/ui/internal-preview-json-sheet";
import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [previewOpen, setPreviewOpen] = useState(false);

  const formPreview = useMemo(() => {
    if (audience === "agence") {
      return {
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
      };
    }

    return {
      email,
      first_name: firstName,
      company,
      besoin,
      budget,
      zone,
      taille,
    };
  }, [
    audience,
    besoin,
    budget,
    company,
    droitRetractation,
    email,
    firstName,
    specialites,
    taille,
    tailleEquipe,
    zone,
  ]);

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
      <InternalResourceToolbar
        edit={{ enabled: false, reason: "Le formulaire ci-dessous est le mode édition" }}
        preview={
          createdRow
            ? { enabled: true }
            : { enabled: false, reason: "Créez une fiche pour prévisualiser le résultat" }
        }
        promote={{ enabled: false, reason: "Non applicable" }}
        delete={{
          enabled: false,
          reason: "Non applicable",
          confirmTitle: "Supprimer la fiche ?",
          confirmDescription: "Non applicable",
        }}
        onPreview={() => setPreviewOpen(true)}
      />

      <InternalPreviewJsonSheet
        title="Preview — fiche créée"
        description={createdRow ? `id ${createdRow.id}` : undefined}
        data={createdRow ?? formPreview}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <div>
        <h2 className="text-xl font-semibold">Créer une fiche {label}</h2>
        <p className="text-sm text-muted-foreground">
          Crée une fiche réelle en base (<code>agence</code> ou <code>entreprise</code>)
          — distincte des cartes mockup carousel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle fiche</CardTitle>
          <CardDescription>
            Les champs marqués * sont obligatoires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
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

            {error ? <InternalStatusAlert variant="error" message={error} /> : null}
            {createdRow ? (
              <InternalStatusAlert
                variant="success"
                title="Fiche créée"
                message={`Fiche ${label} créée — id ${createdRow.id}, slug ${createdRow.slug}.`}
              />
            ) : null}

            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer la fiche"}
            </Button>

            {createdRow ? (
              <InternalJsonPreview label="Aperçu ligne créée" data={createdRow} />
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
