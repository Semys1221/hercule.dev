"use client";

import { useCallback, useEffect, useState } from "react";

import { PricingCard } from "@/components/funnels/widgets/pricing-card";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PricingDocument, PricingPlan } from "@/lib/site/pricing-types";

type PricingEditorProps = {
  audience: "agence" | "entreprise";
};

function PricingEditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function featuresToText(features: string[]): string {
  return features.join("\n");
}

function textToFeatures(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function PricingEditor({ audience }: PricingEditorProps) {
  const [document, setDocument] = useState<PricingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (audience !== "agence") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/pricing/${audience}`);
      const body = (await response.json()) as { document?: PricingDocument; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      setDocument(body.document ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    void load();
  }, [load]);

  function updatePlan(index: number, patch: Partial<PricingPlan>) {
    if (!document) {
      return;
    }
    setDocument({
      ...document,
      plans: document.plans.map((plan, i) => (i === index ? { ...plan, ...patch } : plan)),
    });
  }

  function updatePlanFeatures(index: number, text: string) {
    updatePlan(index, { features: textToFeatures(text) });
  }

  async function save() {
    if (!document) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: PricingDocument = {
        ...document,
        updatedAt: new Date().toISOString(),
      };
      const response = await fetch(`/api/admin/pricing/${audience}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { document?: PricingDocument; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
      setDocument(body.document ?? null);
      setSuccess("Pricing enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (audience !== "agence") {
    return (
      <FunnelPlaceholder
        title="Pricing"
        detail="Aucune tarification pour l'audience entreprise — le service est gratuit."
      />
    );
  }

  if (loading) {
    return <PricingEditorSkeleton />;
  }

  if (!document) {
    return <FunnelPlaceholder title="Pricing introuvable" />;
  }

  return (
    <div className="space-y-6">
      <InternalResourceToolbar
        edit={{ enabled: false, reason: "Édition inline ci-dessous" }}
        preview={{ enabled: false, reason: "Aperçu live en bas de page" }}
        promote={{ enabled: false, reason: "Non applicable" }}
        delete={{
          enabled: false,
          reason: "Non applicable",
          confirmTitle: "Supprimer le pricing ?",
          confirmDescription: "Non applicable",
        }}
        busy={saving}
      />

      <Alert>
        <AlertTitle>Alignement CGV</AlertTitle>
        <AlertDescription>
          La section CGV §5 dans <code>doc/tech-stack/cvg_master.md</code> reste le document légal.
          Vérifiez la cohérence après chaque modification du pricing marketing.
        </AlertDescription>
      </Alert>

      {error && <InternalStatusAlert variant="error" message={error} />}
      {success && <InternalStatusAlert variant="success" message={success} />}

      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
          <CardDescription>
            Source de vérité : <code>content/pricing/agence.json</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pricing-hero-eyebrow">Eyebrow</FieldLabel>
                <Input
                  id="pricing-hero-eyebrow"
                  value={document.hero.eyebrow}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      hero: { ...document.hero, eyebrow: event.target.value },
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pricing-hero-title">Titre</FieldLabel>
                <Textarea
                  id="pricing-hero-title"
                  rows={2}
                  className="resize-none"
                  value={document.hero.title}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      hero: { ...document.hero, title: event.target.value },
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pricing-hero-intro">Introduction</FieldLabel>
                <Textarea
                  id="pricing-hero-intro"
                  rows={3}
                  className="resize-none"
                  value={document.hero.intro}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      hero: { ...document.hero, intro: event.target.value },
                    })
                  }
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {document.plans.map((plan, index) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>Édition du plan et aperçu live.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FieldSet>
              <FieldLegend>{plan.label}</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`plan-name-${plan.id}`}>Nom</FieldLabel>
                  <Input
                    id={`plan-name-${plan.id}`}
                    value={plan.name}
                    onChange={(e) => updatePlan(index, { name: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`plan-label-${plan.id}`}>Label</FieldLabel>
                  <Input
                    id={`plan-label-${plan.id}`}
                    value={plan.label}
                    onChange={(e) => updatePlan(index, { label: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor={`plan-price-${plan.id}`}>Prix</FieldLabel>
                    <Input
                      id={`plan-price-${plan.id}`}
                      value={plan.price}
                      onChange={(e) => updatePlan(index, { price: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`plan-suffix-${plan.id}`}>Suffixe</FieldLabel>
                    <Input
                      id={`plan-suffix-${plan.id}`}
                      value={plan.priceSuffix ?? ""}
                      onChange={(e) => updatePlan(index, { priceSuffix: e.target.value || null })}
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={`plan-tagline-${plan.id}`}>Tagline</FieldLabel>
                  <Input
                    id={`plan-tagline-${plan.id}`}
                    value={plan.tagline}
                    onChange={(e) => updatePlan(index, { tagline: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`plan-summary-${plan.id}`}>Résumé</FieldLabel>
                  <Textarea
                    id={`plan-summary-${plan.id}`}
                    rows={2}
                    className="resize-none"
                    value={plan.summary ?? ""}
                    onChange={(e) => updatePlan(index, { summary: e.target.value || null })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`plan-footer-${plan.id}`}>Footer</FieldLabel>
                  <Input
                    id={`plan-footer-${plan.id}`}
                    value={plan.footer ?? ""}
                    onChange={(e) => updatePlan(index, { footer: e.target.value || null })}
                  />
                </Field>
                <Field orientation="horizontal">
                  <Switch
                    id={`plan-featured-${plan.id}`}
                    checked={plan.featured}
                    onCheckedChange={(checked) => updatePlan(index, { featured: checked })}
                  />
                  <FieldLabel htmlFor={`plan-featured-${plan.id}`} className="font-normal">
                    Featured
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Switch
                    id={`plan-profile-${plan.id}`}
                    checked={plan.profileOnly}
                    onCheckedChange={(checked) => updatePlan(index, { profileOnly: checked })}
                  />
                  <FieldLabel htmlFor={`plan-profile-${plan.id}`} className="font-normal">
                    Profile only
                  </FieldLabel>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`plan-features-${plan.id}`}>Features (une par ligne)</FieldLabel>
                  <Textarea
                    id={`plan-features-${plan.id}`}
                    rows={6}
                    className="resize-none"
                    value={featuresToText(plan.features)}
                    onChange={(e) => updatePlanFeatures(index, e.target.value)}
                  />
                  <FieldDescription>Une feature par ligne.</FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
            <div className="rounded-lg border bg-black p-4">
              <PricingCard
                plan={plan}
                animated={false}
                gatedTeaserFeatures={document.gatedTeaserFeatures}
                gatedGhostFeatures={document.gatedGhostFeatures}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Garantie</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pricing-guarantee-title">Titre</FieldLabel>
                <Input
                  id="pricing-guarantee-title"
                  value={document.guaranteeSection.title}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      guaranteeSection: {
                        ...document.guaranteeSection,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pricing-guarantee-items">Points (un par ligne)</FieldLabel>
                <Textarea
                  id="pricing-guarantee-items"
                  rows={4}
                  className="resize-none"
                  value={featuresToText(document.guaranteeSection.items)}
                  onChange={(event) =>
                    setDocument({
                      ...document,
                      guaranteeSection: {
                        ...document.guaranteeSection,
                        items: textToFeatures(event.target.value),
                      },
                    })
                  }
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
