"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ClientRow } from "@/app/api/admin/clients/route";
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

function dashboardCell(row: ClientRow) {
  const link = row.dashboardLink;
  if (!link) return <span className="text-muted-foreground">—</span>;
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      onClick={(event) => event.stopPropagation()}
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="size-3.5" />
        <span className="sr-only">Ouvrir le dashboard</span>
      </a>
    </Button>
  );
}

const AGENCE_COLUMNS: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "company",
    header: "Société",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.company ?? "—"}</span>
    ),
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
    id: "dashboard",
    header: "Dashboard",
    cell: ({ row }) => dashboardCell(row.original),
  },
];

const ENTREPRISE_COLUMNS: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "company",
    header: "Société",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.company ?? "—"}</span>
    ),
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
    id: "dashboard",
    header: "Dashboard",
    cell: ({ row }) => dashboardCell(row.original),
  },
];

type Tab = "agence" | "entreprise";

export function ClientsTable() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("agence");
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query =
      tab === "agence"
        ? "/api/admin/clients?category=agence&all=true"
        : "/api/admin/clients?category=entreprise&all=true";

    fetch(query)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ clients: ClientRow[] }>;
      })
      .then(({ clients }) => {
        if (!cancelled) setRows(clients);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={tab}
        onValueChange={(v) => v && setTab(v as Tab)}
        variant="outline"
      >
        <ToggleGroupItem value="agence">Agence</ToggleGroupItem>
        <ToggleGroupItem value="entreprise">Entreprise</ToggleGroupItem>
      </ToggleGroup>

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
          columns={tab === "agence" ? AGENCE_COLUMNS : ENTREPRISE_COLUMNS}
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
