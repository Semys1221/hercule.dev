"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CircleHelp } from "lucide-react";

import { FaqPreviewAccordion } from "@/components/internal/funnels/faq-preview-accordion";
import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
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
import { generateFaqEntryId } from "@/lib/site/faq-data";
import type { FaqAudience, FaqDocument, FaqEntry } from "@/lib/site/faq-types";

type FaqEditorProps = {
  audience: FaqAudience;
};

function FaqEditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function FaqEditor({ audience }: FaqEditorProps) {
  const [document, setDocument] = useState<FaqDocument | null>(null);
  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/faq/${audience}`);
      const body = (await response.json()) as { document?: FaqDocument; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      setDocument(body.document ?? null);
      setEntries(body.document?.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateEntry(index: number, patch: Partial<FaqEntry>) {
    setEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  }

  function removeEntry(index: number) {
    setEntries((current) => current.filter((_, i) => i !== index));
  }

  function addEntry() {
    setEntries((current) => [
      ...current,
      {
        id: generateFaqEntryId(audience, current),
        question: "",
        answer: "",
      },
    ]);
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= entries.length) {
      return;
    }
    setEntries((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: FaqDocument = {
        schemaVersion: 1,
        audience,
        updatedAt: new Date().toISOString(),
        entries: entries.filter((entry) => entry.question.trim() && entry.answer.trim()),
      };
      const response = await fetch(`/api/admin/faq/${audience}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { document?: FaqDocument; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
      setDocument(body.document ?? null);
      setEntries(body.document?.entries ?? []);
      setSuccess("FAQ enregistrée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <FaqEditorSkeleton />;
  }

  return (
    <div className="space-y-6">
      <InternalResourceToolbar
        edit={{ enabled: false, reason: "Édition inline ci-dessous" }}
        preview={{ enabled: true }}
        promote={{ enabled: false, reason: "Non applicable" }}
        delete={{
          enabled: false,
          reason: "Non applicable",
          confirmTitle: "Supprimer la FAQ ?",
          confirmDescription: "Non applicable",
        }}
        busy={saving}
        onPreview={() => setPreviewOpen(true)}
      />

      <Card>
        <CardHeader>
          <CardTitle>FAQ — {audience}</CardTitle>
          <CardDescription>
            Source de vérité : <code>content/faq/{audience}.json</code>. Les modifications sont
            versionnées dans git.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <InternalStatusAlert variant="error" message={error} />}
          {success && <InternalStatusAlert variant="success" message={success} />}

          {entries.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleHelp />
                </EmptyMedia>
                <EmptyTitle>Aucune question</EmptyTitle>
                <EmptyDescription>
                  Ajoutez la première entrée FAQ pour cette audience.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" variant="outline" onClick={addEntry} disabled={saving}>
                  Ajouter une question
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <FieldGroup>
              {entries.map((entry, index) => (
                <Card key={entry.id}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <ButtonGroup>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => moveEntry(index, -1)}
                          disabled={index === 0 || saving}
                          aria-label="Monter"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => moveEntry(index, 1)}
                          disabled={index === entries.length - 1 || saving}
                          aria-label="Descendre"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </ButtonGroup>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        disabled={saving}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldSet>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor={`faq-q-${entry.id}`}>Question</FieldLabel>
                          <Input
                            id={`faq-q-${entry.id}`}
                            value={entry.question}
                            onChange={(event) =>
                              updateEntry(index, { question: event.target.value })
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`faq-a-${entry.id}`}>Réponse</FieldLabel>
                          <Textarea
                            id={`faq-a-${entry.id}`}
                            rows={4}
                            className="resize-none"
                            value={entry.answer}
                            onChange={(event) =>
                              updateEntry(index, { answer: event.target.value })
                            }
                          />
                        </Field>
                        <Field orientation="horizontal">
                          <Checkbox
                            id={`faq-cvg-${entry.id}`}
                            checked={Boolean(entry.cvgLink)}
                            onCheckedChange={(checked) =>
                              updateEntry(index, { cvgLink: checked === true })
                            }
                          />
                          <FieldLabel htmlFor={`faq-cvg-${entry.id}`} className="font-normal">
                            Lien vers les CGV
                          </FieldLabel>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                </Card>
              ))}
            </FieldGroup>
          )}

          {document && (
            <FieldDescription>
              Dernière mise à jour : {new Date(document.updatedAt).toLocaleString("fr-FR")}
            </FieldDescription>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addEntry} disabled={saving}>
            Ajouter une question
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </CardFooter>
      </Card>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>FAQ — {audience}</SheetTitle>
            <SheetDescription>Aperçu accordion</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FaqPreviewAccordion entries={entries} />
            {entries.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">Aucune entrée.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
