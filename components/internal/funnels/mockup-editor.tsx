"use client";

import { useEffect, useMemo, useState } from "react";

import { InternalJsonPreview } from "@/components/internal/funnels/ui/internal-json-preview";
import { InternalPreviewJsonSheet } from "@/components/internal/funnels/ui/internal-preview-json-sheet";
import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AgenceDemandeRow } from "@/lib/admin/demandes";
import type { DemandeNiche } from "@/lib/demandes-data";

const NICHE_OPTIONS: DemandeNiche[] = [
  "comptabilite",
  "conseil-financier",
  "renovation",
  "grossiste",
  "a-venir",
];

const ORIGINE_PRESETS = [
  "Recrutement actif",
  "Changement de locaux",
  "Nouveau gérant",
  "Expansion réseau",
  "Refonte identité",
  "Croissance commerciale",
  "Fusion / acquisition",
  "Recrutement mandataires",
  "Recrutement comptable",
  "Recrutement conseillers",
  "Recrutement installateurs",
  "Recrutement commercial",
  "Campagne commerciale",
  "Marchés publics remportés",
  "Migration catalogue digital",
  "Expansion export",
  "Autre",
];

type MockupEditorProps = {
  audience: "agence" | "entreprise";
};

function MockupEditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function MockupEditor({ audience }: MockupEditorProps) {
  const [cards, setCards] = useState<AgenceDemandeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [niche, setNiche] = useState<DemandeNiche>("comptabilite");
  const [secteur, setSecteur] = useState("");
  const [originePreset, setOriginePreset] = useState("Autre");
  const [origineCustom, setOrigineCustom] = useState("");
  const [prestation, setPrestation] = useState("");
  const [budget, setBudget] = useState("");
  const [taille, setTaille] = useState("");
  const [zone, setZone] = useState("");
  const [disponibilite, setDisponibilite] = useState("");
  const [assigned, setAssigned] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");

  const selectedCard = useMemo(
    () => cards.find((card) => card.external_id === selectedId) ?? null,
    [cards, selectedId],
  );

  const previewData = useMemo(() => {
    if (!selectedCard) {
      return null;
    }

    const origine =
      originePreset === "Autre" ? origineCustom.trim() : originePreset;

    if (selectedCard.record_type === "demande") {
      return {
        external_id: selectedCard.external_id,
        record_type: selectedCard.record_type,
        niche,
        secteur: secteur.trim(),
        origine,
        prestation: prestation.trim(),
        budget: budget.trim(),
        taille: taille.trim(),
        zone: zone.trim(),
        disponibilite: disponibilite.trim(),
        status: assigned ? "assigned" : "available",
        available_from: availableFrom,
        available_until: availableUntil,
      };
    }

    return {
      external_id: selectedCard.external_id,
      record_type: selectedCard.record_type,
      secteur: secteur.trim(),
      titre: titre.trim(),
      description: description.trim(),
      note: note.trim(),
    };
  }, [
    assigned,
    availableFrom,
    availableUntil,
    budget,
    description,
    disponibilite,
    niche,
    note,
    origineCustom,
    originePreset,
    prestation,
    secteur,
    selectedCard,
    taille,
    titre,
    zone,
  ]);

  useEffect(() => {
    if (audience !== "agence") {
      setLoading(false);
      return;
    }

    async function loadCards() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/demandes");
        const payload = (await response.json()) as {
          cards?: AgenceDemandeRow[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Impossible de charger les demandes");
        }
        const nextCards = payload.cards ?? [];
        setCards(nextCards);
        if (nextCards.length > 0) {
          setSelectedId(nextCards[0].external_id);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger les demandes",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCards();
  }, [audience]);

  useEffect(() => {
    if (!selectedCard) {
      return;
    }

    if (selectedCard.record_type === "demande") {
      setNiche(selectedCard.niche);
      setSecteur(selectedCard.secteur ?? "");
      const currentOrigine = (selectedCard.origine ?? "").trim();
      if (currentOrigine && ORIGINE_PRESETS.includes(currentOrigine)) {
        setOriginePreset(currentOrigine);
        setOrigineCustom("");
      } else if (currentOrigine) {
        setOriginePreset("Autre");
        setOrigineCustom(currentOrigine);
      } else {
        setOriginePreset("Autre");
        setOrigineCustom("");
      }
      setPrestation(selectedCard.prestation ?? "");
      setBudget(selectedCard.budget ?? "");
      setTaille(selectedCard.taille ?? "");
      setZone(selectedCard.zone ?? "");
      setDisponibilite(selectedCard.disponibilite ?? "");
      setAssigned(selectedCard.status === "assigned");
      setAvailableFrom(selectedCard.available_from ?? "");
      setAvailableUntil(selectedCard.available_until ?? "");
    } else {
      setSecteur(selectedCard.secteur ?? "");
      setTitre(selectedCard.titre ?? "");
      setDescription(selectedCard.description ?? "");
      setNote(selectedCard.note ?? "");
    }
  }, [selectedCard]);

  if (audience !== "agence") {
    return (
      <FunnelPlaceholder
        title="Fiches mockup entreprise"
        detail="Table `entreprise_demandes` non disponible — modèle partagé à venir."
      />
    );
  }

  if (loading) {
    return <MockupEditorSkeleton />;
  }

  if (error && cards.length === 0) {
    return <FunnelPlaceholder title="Erreur" detail={error} />;
  }

  if (cards.length === 0) {
    return (
      <FunnelPlaceholder
        title="Aucune carte"
        detail="Aucune carte en base. Appliquez la migration apply-agence-demandes-migration."
      />
    );
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCard) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const origine =
      originePreset === "Autre" ? origineCustom.trim() : originePreset;

    const fields =
      selectedCard.record_type === "demande"
        ? {
            niche,
            secteur: secteur.trim(),
            origine,
            prestation: prestation.trim(),
            budget: budget.trim(),
            taille: taille.trim(),
            zone: zone.trim(),
            disponibilite: disponibilite.trim(),
            status: assigned ? "assigned" : "available",
            available_from: availableFrom,
            available_until: availableUntil,
          }
        : {
            secteur: secteur.trim(),
            titre: titre.trim(),
            description: description.trim(),
            note: note.trim(),
          };

    try {
      const response = await fetch("/api/admin/demandes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_id: selectedCard.external_id, fields }),
      });
      const payload = (await response.json()) as {
        card?: AgenceDemandeRow;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Erreur lors de la sauvegarde");
      }
      if (payload.card) {
        setCards((current) =>
          current.map((card) =>
            card.external_id === payload.card!.external_id ? payload.card! : card,
          ),
        );
      }
      setSuccess("Carte mise à jour.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Erreur lors de la sauvegarde",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <InternalResourceToolbar
        edit={{ enabled: false, reason: "Le formulaire ci-dessous est le mode édition" }}
        preview={previewData ? { enabled: true } : { enabled: false, reason: "Aucune carte sélectionnée" }}
        promote={{ enabled: false, reason: "Non applicable aux cartes mockup" }}
        delete={{
          enabled: false,
          reason: "Suppression de slots non supportée",
          confirmTitle: "Supprimer la carte ?",
          confirmDescription: "Non applicable",
        }}
        onPreview={() => setPreviewOpen(true)}
      />

      <InternalPreviewJsonSheet
        title="Preview — carte mockup"
        description={selectedCard?.external_id}
        data={previewData}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <p className="text-sm text-muted-foreground">
        Cartes carousel homepage agence (<code>agence_demandes</code>). Édition
        uniquement — pas de création ni suppression de slots.
      </p>

      <div className="space-y-2">
        <Label htmlFor="card-select">Carte à éditer</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger id="card-select">
            <SelectValue placeholder="Choisir une carte" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((card) => (
              <SelectItem key={card.external_id} value={card.external_id}>
                {card.external_id} — {card.secteur}
                {card.record_type === "teaser"
                  ? " (teaser)"
                  : ` [${card.status ?? "n/a"}]`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCard ? (
        <Card>
          <CardHeader>
            <CardTitle>Édition : {selectedCard.external_id}</CardTitle>
            <CardDescription>
              Type : {selectedCard.record_type} · Ordre carousel : {selectedCard.sort_order}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-6">
              {selectedCard.record_type === "demande" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Niche</Label>
                    <Select value={niche} onValueChange={(value) => setNiche(value as DemandeNiche)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NICHE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secteur">Secteur</Label>
                    <Input id="secteur" value={secteur} onChange={(e) => setSecteur(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Origine (preset)</Label>
                    <Select value={originePreset} onValueChange={setOriginePreset}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...ORIGINE_PRESETS.filter((value) => value !== "Autre"), "Autre"].map(
                          (option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {originePreset === "Autre" ? (
                    <div className="space-y-2">
                      <Label htmlFor="origine-custom">Origine (saisie libre)</Label>
                      <Input
                        id="origine-custom"
                        value={origineCustom}
                        onChange={(e) => setOrigineCustom(e.target.value)}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="prestation">Prestation</Label>
                    <Textarea
                      id="prestation"
                      value={prestation}
                      onChange={(e) => setPrestation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taille">Taille</Label>
                    <Input id="taille" value={taille} onChange={(e) => setTaille(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disponibilite">Disponibilité</Label>
                    <Input
                      id="disponibilite"
                      value={disponibilite}
                      onChange={(e) => setDisponibilite(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={assigned} onCheckedChange={setAssigned} id="assigned" />
                    <Label htmlFor="assigned">Attribué</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="available-from">Disponible à partir du</Label>
                    <Input
                      id="available-from"
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="available-until">Disponible jusqu&apos;au</Label>
                    <Input
                      id="available-until"
                      type="date"
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teaser-secteur">Secteur</Label>
                    <Input
                      id="teaser-secteur"
                      value={secteur}
                      onChange={(e) => setSecteur(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titre">Titre</Label>
                    <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                </div>
              )}

              {error ? <InternalStatusAlert variant="error" message={error} /> : null}
              {success ? <InternalStatusAlert variant="success" message={success} /> : null}

              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>

              <InternalJsonPreview label="Aperçu JSON" data={selectedCard} />
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
