"use client";

import { useCallback, useEffect, useState } from "react";

import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import type { SequenceEditorAdapter, SequenceStep } from "./types";

type SequenceDropdownProps = {
  title: string;
  description?: string;
  adapter: SequenceEditorAdapter;
};

export function SequenceDropdown({ title, description, adapter }: SequenceDropdownProps) {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStepId, setPreviewStepId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    body: string;
    html?: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await adapter.load();
      setSteps(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStep = (index: number, patch: Partial<SequenceStep>) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  };

  const insertVariable = (index: number, variable: string) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, body: `${step.body}${variable}` } : step,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adapter.save(steps);
      setSuccess("Séquence enregistrée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (stepId: string) => {
    if (!adapter.preview) {
      const step = steps.find((item) => item.id === stepId);
      if (step) {
        setPreviewContent({ subject: step.subject, body: step.body });
        setPreviewStepId(stepId);
        setPreviewOpen(true);
      }
      return;
    }
    setPreviewLoading(true);
    setPreviewStepId(stepId);
    setPreviewOpen(true);
    try {
      const content = await adapter.preview(stepId, steps);
      setPreviewContent(content);
    } catch (err) {
      setPreviewContent({
        subject: "Erreur",
        body: err instanceof Error ? err.message : "Prévisualisation impossible",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <InternalResourceToolbar
        edit={{ enabled: false, reason: "Édition inline ci-dessous" }}
        preview={{ enabled: false, reason: "Prévisualiser par step" }}
        promote={{ enabled: false, reason: "Non applicable" }}
        delete={{
          enabled: false,
          reason: "Non applicable",
          confirmTitle: "Supprimer la séquence ?",
          confirmDescription: "Non applicable",
        }}
        busy={saving}
      />

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}
      {success ? <InternalStatusAlert variant="success" message={success} /> : null}

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Variables :</span>
        {adapter.variables.map((variable) => (
          <Badge key={variable} variant="outline" className="font-mono text-xs">
            {variable}
          </Badge>
        ))}
      </div>

      <Accordion type="multiple" defaultValue={steps.map((step) => step.id)} className="space-y-2">
        {steps.map((step, index) => (
          <AccordionItem key={step.id} value={step.id} className="rounded-lg border px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center gap-3 text-left">
                <span className="font-medium">{step.label}</span>
                <Badge variant="secondary">{step.delay}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              {step.id !== "prompt" ? (
                step.subjectManaged ? (
                  <p className="text-sm text-muted-foreground">
                    Objet géré automatiquement à l&apos;envoi (Re: …).
                  </p>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Objet</label>
                    <Input
                      value={step.subject}
                      onChange={(event) =>
                        updateStep(index, { subject: event.target.value })
                      }
                    />
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Niche : {step.subject}
                </p>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {step.bodyFormat === "html" ? "Corps (HTML)" : "Corps"}
                </label>
                <Textarea
                  value={step.body}
                  onChange={(event) => updateStep(index, { body: event.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {adapter.variables.map((variable) => (
                  <Button
                    key={`${step.id}-${variable}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(index, variable)}
                  >
                    + {variable}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handlePreview(step.id)}
                >
                  Prévisualiser
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button type="button" onClick={() => void handleSave()} disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer la séquence"}
      </Button>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Prévisualisation</SheetTitle>
            <SheetDescription>
              {previewStepId
                ? steps.find((step) => step.id === previewStepId)?.label
                : ""}
            </SheetDescription>
          </SheetHeader>
          {previewLoading ? (
            <Skeleton className="mt-4 h-48 w-full" />
          ) : previewContent ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Objet</p>
                <p className="text-sm">{previewContent.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Corps</p>
                {previewContent.html ? (
                  <div
                    className="prose prose-sm max-w-none rounded-md border p-4"
                    dangerouslySetInnerHTML={{ __html: previewContent.html }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">
                    {previewContent.body}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
