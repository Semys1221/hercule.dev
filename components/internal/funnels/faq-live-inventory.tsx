"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import { FaqEditor } from "@/components/internal/funnels/faq-editor";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FAQ_LIVE_KIND_LABELS,
  getLiveInstancesForAudience,
  getQuestionCountForInstance,
  type FaqLiveInstance,
} from "@/lib/admin/faq/live-registry";
import type { FaqAudience, FaqDocument } from "@/lib/site/faq-types";

type FaqLiveInventoryProps = {
  audience: FaqAudience;
};

type AudienceFilter = FaqAudience | "tous";

type LiveRow = FaqLiveInstance & { questions: number };

export function FaqLiveInventory({ audience }: FaqLiveInventoryProps) {
  const [filter, setFilter] = useState<AudienceFilter>(audience);
  const [documents, setDocuments] = useState<Partial<Record<FaqAudience, FaqDocument>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agenceResponse, entrepriseResponse] = await Promise.all([
        fetch("/api/admin/faq/agence"),
        fetch("/api/admin/faq/entreprise"),
      ]);
      const agenceBody = (await agenceResponse.json()) as {
        document?: FaqDocument;
        error?: string;
      };
      const entrepriseBody = (await entrepriseResponse.json()) as {
        document?: FaqDocument;
        error?: string;
      };
      if (!agenceResponse.ok) {
        throw new Error(agenceBody.error ?? "Chargement FAQ agence impossible");
      }
      if (!entrepriseResponse.ok) {
        throw new Error(entrepriseBody.error ?? "Chargement FAQ entreprise impossible");
      }
      setDocuments({
        agence: agenceBody.document,
        entreprise: entrepriseBody.document,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows: LiveRow[] = useMemo(() => {
    return getLiveInstancesForAudience(filter).map((instance) => ({
      ...instance,
      questions: getQuestionCountForInstance(instance, documents),
    }));
  }, [documents, filter]);

  const selected = rows.find((row) => row.id === selectedId) ?? null;

  const columns: ColumnDef<LiveRow>[] = [
    {
      accessorKey: "name",
      header: "Instance",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "title",
      header: "Titre",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "location",
      header: "Localisation",
      cell: ({ row }) => <code className="text-xs">{row.original.location}</code>,
    },
    {
      accessorKey: "audience",
      header: "Audience",
      cell: ({ row }) => <Badge variant="outline">{row.original.audience}</Badge>,
    },
    {
      accessorKey: "questions",
      header: "Questions",
    },
    {
      accessorKey: "kind",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary">{FAQ_LIVE_KIND_LABELS[row.original.kind]}</Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(value) => {
          if (value) {
            setFilter(value as AudienceFilter);
          }
        }}
        variant="outline"
      >
        <ToggleGroupItem value="tous">Tous</ToggleGroupItem>
        <ToggleGroupItem value="agence">Agence</ToggleGroupItem>
        <ToggleGroupItem value="entreprise">Entreprise</ToggleGroupItem>
      </ToggleGroup>

      <ArchitectureDataTable
        columns={columns}
        data={rows}
        searchColumn="name"
        searchPlaceholder="Rechercher une instance…"
        getRowId={(row) => row.id}
        selectedRowId={selectedId}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{selected?.name ?? "FAQ live"}</SheetTitle>
            <SheetDescription>
              {selected ? `${selected.title} — ${selected.location}` : "Instance FAQ"}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            {selected?.kind === "dashboard" ? (
              <Alert>
                <AlertTitle>FAQ dashboard en lecture seule</AlertTitle>
                <AlertDescription>
                  Ces questions sont hardcodées dans{" "}
                  <code>{selected.sourcePath}</code>. Elles ne passent pas par le master
                  JSON. Ouvrez le fichier source pour les modifier.
                </AlertDescription>
              </Alert>
            ) : null}
            {selected && selected.kind !== "dashboard" ? (
              <div className="flex flex-col gap-4">
                {selected.kind === "funnel_component" ? (
                  <Alert>
                    <AlertTitle>Widget funnel</AlertTitle>
                    <AlertDescription>
                      Les blocs FAQ des funnels affichent le master (moins les questions
                      masquées). L’édition ci-dessous met à jour{" "}
                      <code>content/faq/{selected.audience}.json</code>.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <FaqEditor audience={selected.audience} />
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
