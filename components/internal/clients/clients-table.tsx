"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import type { ClientRow } from "@/app/api/admin/clients/route";
import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";
import { isSeedSlug } from "@/lib/admin/clients/seed";
import { PRODUCT_STATUT_LABELS } from "@/lib/admin/clients/types";

function StatutBadge({ statut }: { statut: string }) {
  const label = PRODUCT_STATUT_LABELS[statut] ?? statut;

  const variant =
    statut === "IN_DELIVERANCE" || statut === "SOLD" || statut === "MEETING_BOOKED"
      ? "default"
      : statut === "CANCELLED" || statut === "ARCHIVED"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
}

function dashboardPreviewUrl(row: ClientRow): string | null {
  if (row.dashboardLink) return row.dashboardLink;
  if (row.category === "agence") {
    return `/dashboard/${row.slug}`;
  }
  return null;
}

type RowActionsProps = {
  row: ClientRow;
  onDeleted: (id: string) => void;
};

function RowActions({ row, onDeleted }: RowActionsProps) {
  const [deleting, setDeleting] = React.useState(false);
  const previewUrl = dashboardPreviewUrl(row);
  const isSeed = isSeedSlug(row.slug);

  async function handleDelete() {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/clients/${row.category}/${row.slug}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Suppression impossible");
      onDeleted(row.id);
      toast({ title: "Client démo supprimé" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      {previewUrl ? (
        <Button variant="outline" size="sm" asChild>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Aperçu
          </a>
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
      {isSeed ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={deleting}>
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce client démo ?</AlertDialogTitle>
              <AlertDialogDescription>
                {row.company ?? row.email} sera définitivement supprimé de la base. Cette action
                ne s&apos;applique qu&apos;aux lignes préfixées <code>seed-</code>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

function companyCell(row: ClientRow) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">{row.company ?? "—"}</span>
      {isSeedSlug(row.slug) ? (
        <Badge variant="outline" className="text-xs">
          Démo
        </Badge>
      ) : null}
    </div>
  );
}

function buildAgenceColumns(onDeleted: (id: string) => void): ColumnDef<ClientRow>[] {
  return [
    {
      accessorKey: "company",
      header: "Société",
      cell: ({ row }) => companyCell(row.original),
    },
    {
      accessorKey: "firstName",
      header: "Contact",
      cell: ({ row }) => row.original.firstName ?? "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "productStatut",
      header: "Statut produit",
      cell: ({ row }) => <StatutBadge statut={row.original.productStatut} />,
    },
    {
      accessorKey: "form.specialites",
      id: "specialites",
      header: "Spécialités",
      cell: ({ row }) => {
        const specialites = row.original.form.specialites;
        if (!specialites || specialites.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="line-clamp-2 max-w-48 text-sm">{specialites.join(", ")}</span>
        );
      },
    },
    {
      accessorKey: "form.zone",
      id: "zone",
      header: "Zone",
      cell: ({ row }) => (
        <span>
          {row.original.form.zone ?? <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    {
      accessorKey: "form.capacite",
      id: "capacite",
      header: "Capacité",
      cell: ({ row }) => {
        const capacite = row.original.form.capacite;
        return capacite != null ? (
          <span>{capacite} proj./mois</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "onboardingCompletedAt",
      header: "Onboardé le",
      cell: ({ row }) => {
        if (!row.original.onboardingCompletedAt) {
          return <span className="text-muted-foreground">—</span>;
        }
        const date = new Date(row.original.onboardingCompletedAt);
        return (
          <span className="whitespace-nowrap text-muted-foreground text-sm">
            {date.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <RowActions row={row.original} onDeleted={onDeleted} />,
    },
  ];
}

function buildEntrepriseColumns(onDeleted: (id: string) => void): ColumnDef<ClientRow>[] {
  return [
    {
      accessorKey: "company",
      header: "Société",
      cell: ({ row }) => companyCell(row.original),
    },
    {
      accessorKey: "firstName",
      header: "Contact",
      cell: ({ row }) => row.original.firstName ?? "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "productStatut",
      header: "Statut produit",
      cell: ({ row }) => <StatutBadge statut={row.original.productStatut} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => <RowActions row={row.original} onDeleted={onDeleted} />,
    },
  ];
}

type Tab = "agence" | "entreprise";

export function ClientsTable() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("agence");
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadRows = React.useCallback(async (activeTab: Tab) => {
    setLoading(true);
    setError(null);

    const query =
      activeTab === "agence"
        ? "/api/admin/clients?category=agence&all=true"
        : "/api/admin/clients?category=entreprise&all=true";

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { clients } = (await res.json()) as { clients: ClientRow[] };
      setRows(clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRows(tab);
  }, [tab, loadRows]);

  const handleDeleted = React.useCallback((id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  }, []);

  const seedCount = rows.filter((row) => isSeedSlug(row.slug)).length;

  async function handleSeed() {
    setSeeding(true);
    try {
      const response = await fetch("/api/admin/clients/seed", { method: "POST" });
      const body = (await response.json()) as { error?: string; slugs?: string[] };
      if (!response.ok) throw new Error(body.error ?? "Seed impossible");
      await loadRows(tab);
      toast({
        title: "Données démo chargées",
        description: `${body.slugs?.length ?? 0} fiches seed mises à jour.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Chargement démo impossible",
        description: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setSeeding(false);
    }
  }

  const columns =
    tab === "agence" ? buildAgenceColumns(handleDeleted) : buildEntrepriseColumns(handleDeleted);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(v) => v && setTab(v as Tab)}
          variant="outline"
        >
          <ToggleGroupItem value="agence">Agence</ToggleGroupItem>
          <ToggleGroupItem value="entreprise">Entreprise</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-2">
          {seedCount > 0 ? (
            <Badge variant="secondary">{seedCount} ligne(s) démo</Badge>
          ) : null}
          <Button type="button" variant="outline" disabled={seeding} onClick={() => void handleSeed()}>
            {seeding ? "Chargement…" : "Charger données démo"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : error ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <ArchitectureDataTable
          columns={columns}
          data={rows}
          searchColumn="email"
          searchPlaceholder="Rechercher par email ou société…"
          onRowClick={(row) => router.push(`/internal/clients/${row.category}/${row.slug}`)}
          getRowId={(row) => row.id}
        />
      )}
    </div>
  );
}
