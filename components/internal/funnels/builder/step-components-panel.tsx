"use client";

import { useMemo, useState } from "react";

import { FaqWidgetStack } from "@/components/funnels/widgets/faq-widget-stack";
import { PricingWidget } from "@/components/funnels/widgets/pricing-widget";
import { FaqPreviewAccordion } from "@/components/internal/funnels/faq-preview-accordion";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import type {
  FaqComponentConfig,
  FunnelDocument,
  FunnelScope,
  FunnelStep,
  StepComponents,
} from "@/lib/admin/funnels/schema";
import { generateFaqEntryId, resolveFaqForComponent } from "@/lib/site/faq-data";
import type { FaqEntry } from "@/lib/site/faq-types";

type StepComponentsPanelProps = {
  scope: FunnelScope;
  funnel: FunnelDocument;
  step: FunnelStep;
  onSaved: (funnel: FunnelDocument) => void;
};

type AddMode = "local" | "permanent";

function makeInstanceId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function emptyComponents(): StepComponents {
  return {};
}

export function StepComponentsPanel({ scope, funnel, step, onSaved }: StepComponentsPanelProps) {
  const components = step.components ?? emptyComponents();
  const faqInstances = components.faq ?? [];
  const pricingInstance = components.pricing;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>("local");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const resolvedByInstance = useMemo(() => {
    return faqInstances.map((config) => ({
      config,
      entries: resolveFaqForComponent(scope.audience, config),
    }));
  }, [faqInstances, scope.audience]);

  async function persistComponents(nextComponents: StepComponents) {
    setBusy(true);
    setError(null);
    try {
      const steps = funnel.steps.map((item) =>
        item.id === step.id ? { ...item, components: nextComponents } : item,
      );
      const response = await fetch(funnelApiUrl(`/${funnel.slug}`, scope), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      });
      const body = (await response.json()) as { funnel?: FunnelDocument; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Erreur de sauvegarde");
      }
      if (body.funnel) {
        onSaved(body.funnel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  function updateFaqInstances(nextFaq: FaqComponentConfig[]) {
    void persistComponents({
      ...components,
      faq: nextFaq.length > 0 ? nextFaq : undefined,
    });
  }

  function addFaqInstance() {
    if (faqInstances.length >= 2) {
      return;
    }
    updateFaqInstances([
      ...faqInstances,
      { id: makeInstanceId("faq_inst"), hiddenIds: [], localEntries: [] },
    ]);
  }

  function removeFaqInstance(instanceId: string) {
    updateFaqInstances(faqInstances.filter((item) => item.id !== instanceId));
  }

  function hideFaqEntry(instanceId: string, entryId: string) {
    updateFaqInstances(
      faqInstances.map((item) =>
        item.id === instanceId
          ? { ...item, hiddenIds: [...new Set([...item.hiddenIds, entryId])] }
          : item,
      ),
    );
  }

  function addPricingInstance() {
    void persistComponents({
      ...components,
      pricing: { id: makeInstanceId("pricing_inst") },
    });
  }

  function removePricingInstance() {
    void persistComponents({
      ...components,
      pricing: undefined,
    });
  }

  function openAddDialog(instanceId: string) {
    setActiveFaqId(instanceId);
    setAddMode("local");
    setNewQuestion("");
    setNewAnswer("");
    setDialogOpen(true);
  }

  async function submitNewEntry() {
    if (!activeFaqId || !newQuestion.trim() || !newAnswer.trim()) {
      return;
    }

    const entry: FaqEntry = {
      id: `local_${crypto.randomUUID().slice(0, 8)}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };

    if (addMode === "permanent") {
      setBusy(true);
      setError(null);
      try {
        const getResponse = await fetch(`/api/admin/faq/${scope.audience}`);
        const getBody = (await getResponse.json()) as {
          document?: { entries: FaqEntry[]; schemaVersion: 1; audience: string; updatedAt: string };
          error?: string;
        };
        if (!getResponse.ok || !getBody.document) {
          throw new Error(getBody.error ?? "Chargement FAQ impossible");
        }
        const faqDocument = getBody.document;
        const permanentEntry: FaqEntry = {
          ...entry,
          id: generateFaqEntryId(scope.audience, faqDocument.entries),
        };
        const response = await fetch(`/api/admin/faq/${scope.audience}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...faqDocument,
            entries: [...faqDocument.entries, permanentEntry],
            updatedAt: new Date().toISOString(),
          }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Ajout permanent impossible");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setBusy(false);
        return;
      } finally {
        setBusy(false);
      }
    } else {
      updateFaqInstances(
        faqInstances.map((item) =>
          item.id === activeFaqId
            ? { ...item, localEntries: [...item.localEntries, entry] }
            : item,
        ),
      );
    }

    setDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Composants</CardTitle>
        <CardDescription>
          Ajoutez jusqu&apos;à 2 blocs FAQ et un bloc Pricing sur cette étape.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <InternalStatusAlert variant="error" message={error} />}

        <ButtonGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || faqInstances.length >= 2}
            onClick={addFaqInstance}
          >
            Ajouter FAQ
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || Boolean(pricingInstance)}
            onClick={addPricingInstance}
          >
            Ajouter Pricing
          </Button>
        </ButtonGroup>

        {faqInstances.length > 0 && (
          <div className="space-y-4">
            <FaqWidgetStack audience={scope.audience} configs={faqInstances} compact />
            {resolvedByInstance.map(({ config, entries }, index) => (
              <Card key={config.id} className="border-dashed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">FAQ {index + 1}</CardTitle>
                  <ButtonGroup>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => openAddDialog(config.id)}
                    >
                      Ajouter Q/R
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => removeFaqInstance(config.id)}
                    >
                      Retirer
                    </Button>
                  </ButtonGroup>
                </CardHeader>
                <CardContent>
                  <FaqPreviewAccordion entries={entries} className="w-full" />
                  {entries.length > 0 && (
                    <FieldGroup className="mt-4 gap-3">
                      {entries.map((entry) => (
                        <Field key={entry.id} orientation="horizontal">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy || config.hiddenIds.includes(entry.id)}
                            onClick={() => hideFaqEntry(config.id, entry.id)}
                          >
                            Masquer « {entry.question.slice(0, 40)}
                            {entry.question.length > 40 ? "…" : ""} »
                          </Button>
                        </Field>
                      ))}
                    </FieldGroup>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pricingInstance && (
          <Card className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Pricing</CardTitle>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={removePricingInstance}
              >
                Retirer
              </Button>
            </CardHeader>
            <CardContent>
              <PricingWidget audience={scope.audience} config={pricingInstance} compact />
            </CardContent>
          </Card>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une question</DialogTitle>
            <DialogDescription>
              Choisissez si l&apos;ajout est local à cette étape ou permanent dans la source de
              vérité.
            </DialogDescription>
          </DialogHeader>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>Portée de l&apos;ajout</FieldLabel>
                <RadioGroup
                  value={addMode}
                  onValueChange={(value) => setAddMode(value as AddMode)}
                  className="gap-3"
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem value="local" id="faq-add-local" />
                    <FieldLabel htmlFor="faq-add-local" className="font-normal">
                      Local — uniquement ce composant
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem value="permanent" id="faq-add-permanent" />
                    <FieldLabel htmlFor="faq-add-permanent" className="font-normal">
                      Permanent — source de vérité FAQ
                    </FieldLabel>
                  </Field>
                </RadioGroup>
                <FieldDescription>
                  Les ajouts permanents mettent à jour <code>content/faq/{scope.audience}.json</code>
                  .
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="faq-add-question">Question</FieldLabel>
                <Input
                  id="faq-add-question"
                  value={newQuestion}
                  onChange={(event) => setNewQuestion(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="faq-add-answer">Réponse</FieldLabel>
                <Textarea
                  id="faq-add-answer"
                  rows={4}
                  className="resize-none"
                  value={newAnswer}
                  onChange={(event) => setNewAnswer(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={busy || !newQuestion.trim() || !newAnswer.trim()}
              onClick={() => void submitNewEntry()}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
