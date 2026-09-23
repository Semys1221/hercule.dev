"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENGIN_TEST_RECIPIENT } from "@/lib/engin/communication/constants";

import type { CatalogItem, SequenceStep } from "./communication-types";

export function SequenceCommunicationEditor() {
  const [sequences, setSequences] = useState<CatalogItem[]>([]);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [niche, setNiche] = useState("comptable");
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [revision, setRevision] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const loadCatalog = useCallback(async () => {
    const response = await fetch("/api/admin/engin/communication/catalog");
    const payload = (await response.json()) as { sequences: CatalogItem[] };
    setSequences(payload.sequences ?? []);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const grouped = useMemo(() => {
    const groups = new Map<string, CatalogItem[]>();
    for (const item of sequences) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return [...groups.entries()];
  }, [sequences]);

  const loadSelection = useCallback(
    async (id: string, nextNiche?: string) => {
      setError(null);
      setStatus(null);
      setPreviewHtml(null);
      setSelectionId(id);
      const nicheQuery = nextNiche ?? niche;
      const response = await fetch(
        `/api/admin/engin/communication/sequences/${id}?niche=${nicheQuery}`,
      );
      const payload = (await response.json()) as {
        steps?: SequenceStep[];
        sequence?: { audiences?: string[] };
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Chargement impossible");
        return;
      }
      const loaded = payload.steps ?? [];
      setSteps(loaded);
      setAudiences(payload.sequence?.audiences ?? []);
      setActiveStep(0);
      setSubject(loaded[0]?.subject ?? "");
      setBody(loaded[0]?.body ?? "");
      setRevision((value) => value + 1);
    },
    [niche],
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = body;
    }
  }, [revision]);

  const currentStep = steps[activeStep];

  const save = async () => {
    if (!selectionId) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const nextSteps = steps.map((step, index) =>
        index === activeStep ? { ...step, subject, body } : step,
      );
      const response = await fetch(
        `/api/admin/engin/communication/sequences/${selectionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche, steps: nextSteps }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Enregistrement impossible");
      setSteps(nextSteps);
      setStatus("Enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (!selectionId) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/engin/communication/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "sequence",
          id: selectionId,
          niche,
          stepId: currentStep?.id,
          subject,
          body,
          recipientEmail: ENGIN_TEST_RECIPIENT,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Envoi impossible");
      setStatus(`Test envoyé à ${ENGIN_TEST_RECIPIENT}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  const preview = async () => {
    if (!selectionId || !currentStep?.emailType) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/booking-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: niche,
          emailType: currentStep.emailType,
          subject,
          body,
        }),
      });
      const payload = (await response.json()) as { html?: string; text?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Aperçu impossible");
      setPreviewHtml(payload.html ?? `<pre>${payload.text ?? ""}</pre>`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aperçu impossible");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectionId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/engin/communication/sequences/${selectionId}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Suppression impossible");
      setSelectionId(null);
      setConfirmDelete(false);
      await loadCatalog();
      setStatus("Séquence supprimée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Séquences</CardTitle>
          <CardDescription>Templates Resend — parcours automatisés.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-3">
            <div className="flex flex-col gap-4">
              {grouped.map(([category, items]) => (
                <div key={category} className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground">{category}</p>
                  {items.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant={selectionId === item.id ? "secondary" : "ghost"}
                      className="h-auto justify-start px-2 py-1.5 text-left"
                      onClick={() => void loadSelection(item.id)}
                    >
                      <span className="flex flex-col items-start gap-0.5">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.stepCount} étape(s)
                        </span>
                      </span>
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectionId ? "Édition séquence" : "Choisir une séquence"}</CardTitle>
          <CardDescription>
            Le texte s’édite tel qu’il sera lu. L’enregistrement écrit le template dans le dépôt.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          {selectionId ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void save()} disabled={busy}>
                  Enregistrer
                </Button>
                <Button type="button" variant="secondary" onClick={() => void sendTest()} disabled={busy}>
                  Envoyer un test
                </Button>
                <Button type="button" variant="outline" onClick={() => void preview()} disabled={busy}>
                  Aperçu HTML
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  Supprimer
                </Button>
              </div>
              {audiences.length > 0 ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Niche</FieldLabel>
                    <Select
                      value={niche}
                      onValueChange={(value) => {
                        setNiche(value);
                        void loadSelection(selectionId, value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audiences.map((audience) => (
                          <SelectItem key={audience} value={audience}>
                            {audience}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              ) : null}
              {steps.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {steps.map((step, index) => (
                    <Button
                      key={step.id}
                      type="button"
                      size="sm"
                      variant={index === activeStep ? "secondary" : "outline"}
                      onClick={() => {
                        const nextSteps = steps.map((item, itemIndex) =>
                          itemIndex === activeStep ? { ...item, subject, body } : item,
                        );
                        setSteps(nextSteps);
                        setActiveStep(index);
                        setSubject(nextSteps[index]?.subject ?? "");
                        setBody(nextSteps[index]?.body ?? "");
                        setPreviewHtml(null);
                        setRevision((value) => value + 1);
                      }}
                    >
                      {step.label}
                      <Badge variant="outline">{step.delay}</Badge>
                    </Button>
                  ))}
                </div>
              ) : null}
              <FieldGroup>
                <Field>
                  <FieldLabel>Objet</FieldLabel>
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    disabled={currentStep?.subjectManaged}
                  />
                </Field>
                <Field>
                  <FieldLabel>Texte</FieldLabel>
                  <div
                    ref={editorRef}
                    className="min-h-64 rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    onBlur={(event) => setBody(event.currentTarget.innerText)}
                  />
                </Field>
              </FieldGroup>
              {previewHtml ? (
                <div
                  className="rounded-md border border-border bg-card p-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séquence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les templates Supabase, les fichiers markdown et l’entrée du catalogue Resend seront retirés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
