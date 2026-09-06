"use client";

import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { generateFaqEntryId } from "@/lib/site/faq-data";
import type { FaqAudience, FaqDocument, FaqEntry } from "@/lib/site/faq-types";

type FaqMasterTableProps = {
  audience: FaqAudience;
};

type FaqMasterRow = FaqEntry & { index: number };

function truncate(value: string, max = 80): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function FaqMasterTable({ audience }: FaqMasterTableProps) {
  const [document, setDocument] = useState<FaqDocument | null>(null);
  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const rows: FaqMasterRow[] = useMemo(
    () => entries.map((entry, index) => ({ ...entry, index })),
    [entries],
  );

  const editingEntry = editingIndex === null ? null : (entries[editingIndex] ?? null);

  function updateEntry(index: number, patch: Partial<FaqEntry>) {
    setEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  }

  function removeEntry(index: number) {
    setEntries((current) => current.filter((_, i) => i !== index));
    setEditingIndex((current) => {
      if (current === null) {
        return null;
      }
      if (current === index) {
        return null;
      }
      if (current > index) {
        return current - 1;
      }
      return current;
    });
  }

  function addEntry() {
    const next = [
      ...entries,
      {
        id: generateFaqEntryId(audience, entries),
        question: "",
        answer: "",
      },
    ];
    setEntries(next);
    setEditingIndex(next.length - 1);
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
    setEditingIndex((current) => {
      if (current === index) {
        return target;
      }
      if (current === target) {
        return index;
      }
      return current;
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

  const columns: ColumnDef<FaqMasterRow>[] = [
    {
      accessorKey: "index",
      header: "#",
      cell: ({ row }) => row.original.index + 1,
      enableHiding: false,
    },
    {
      accessorKey: "question",
      header: "Question",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.question || "—"}</span>
      ),
    },
    {
      accessorKey: "answer",
      header: "Réponse",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{truncate(row.original.answer) || "—"}</span>
      ),
    },
    {
      accessorKey: "cvgLink",
      header: "CVG",
      cell: ({ row }) =>
        row.original.cvgLink ? <Badge variant="secondary">CGV</Badge> : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const index = row.original.index;
        return (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <ButtonGroup>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => moveEntry(index, -1)}
                disabled={index === 0 || saving}
                aria-label="Monter"
              >
                <ChevronUp data-icon="inline-start" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => moveEntry(index, 1)}
                disabled={index === entries.length - 1 || saving}
                aria-label="Descendre"
              >
                <ChevronDown data-icon="inline-start" />
              </Button>
            </ButtonGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingIndex(index)}
              disabled={saving}
            >
              <Pencil data-icon="inline-start" />
              Éditer
            </Button>
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
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <InternalStatusAlert variant="error" message={error} /> : null}
      {success ? <InternalStatusAlert variant="success" message={success} /> : null}

      <ArchitectureDataTable
        columns={columns}
        data={rows}
        searchColumn="question"
        searchPlaceholder="Rechercher une question…"
        getRowId={(row) => row.id}
        selectedRowId={editingEntry?.id ?? null}
        onRowClick={(row) => setEditingIndex(row.index)}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={addEntry} disabled={saving}>
              Ajouter une question
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        }
        footer={
          document ? (
            <p className="text-sm text-muted-foreground">
              Source : <code>content/faq/{audience}.json</code>
              {" · "}
              Dernière mise à jour : {new Date(document.updatedAt).toLocaleString("fr-FR")}
            </p>
          ) : null
        }
      />

      <Sheet
        open={editingIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingIndex(null);
          }
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {editingEntry?.question.trim() ? "Éditer la question" : "Nouvelle question"}
            </SheetTitle>
            <SheetDescription>
              Les modifications s’enregistrent dans le master FAQ ({audience}).
            </SheetDescription>
          </SheetHeader>
          {editingEntry && editingIndex !== null ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`faq-master-q-${editingEntry.id}`}>Question</FieldLabel>
                    <Input
                      id={`faq-master-q-${editingEntry.id}`}
                      value={editingEntry.question}
                      onChange={(event) =>
                        updateEntry(editingIndex, { question: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`faq-master-a-${editingEntry.id}`}>Réponse</FieldLabel>
                    <Textarea
                      id={`faq-master-a-${editingEntry.id}`}
                      rows={8}
                      className="resize-none"
                      value={editingEntry.answer}
                      onChange={(event) =>
                        updateEntry(editingIndex, { answer: event.target.value })
                      }
                    />
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox
                      id={`faq-master-cvg-${editingEntry.id}`}
                      checked={Boolean(editingEntry.cvgLink)}
                      onCheckedChange={(checked) =>
                        updateEntry(editingIndex, { cvgLink: checked === true })
                      }
                    />
                    <FieldLabel htmlFor={`faq-master-cvg-${editingEntry.id}`} className="font-normal">
                      Lien vers les CGV
                    </FieldLabel>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </div>
          ) : null}
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setEditingIndex(null)}>
              Fermer
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
