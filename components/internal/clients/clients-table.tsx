"use client";

import { ExternalLink } from "lucide-react";
import * as React from "react";

import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ClientRow } from "@/app/api/admin/clients/route";
import { MatchingPanel } from "@/components/internal/clients/matching-panel";

// ─── Product statut badge ────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  NONE: "—",
  PAID_PENDING_ONBOARDING: "En attente onboarding",
  IN_DELIVERANCE: "En livraison",
  MATCH_PROPOSED: "Match proposé",
  MEETING_BOOKED: "RDV réservé",
  POST_RDV_SURVEY: "Post-RDV",
  SOLD: "Vendu",
  ARCHIVED: "Archivé",
  CANCELLED: "Annulé",
  ONBOARDED: "Onboardé",
};

function StatutBadge({ statut }: { statut: string }) {
  const label = STATUT_LABELS[statut] ?? statut;

  const variant =
    statut === "IN_DELIVERANCE" || statut === "SOLD"
      ? "default"
      : statut === "CANCELLED" || statut === "ARCHIVED"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Agence table columns ────────────────────────────────────────────────────

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
      if (!specialites || specialites.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="line-clamp-2 max-w-48 text-sm">
          {specialites.join(", ")}
        </span>
      );
    },
  },
  {
    accessorKey: "form.zone",
    id: "zone",
    header: "Zone",
    cell: ({ row }) => (
      <span>{row.original.form.zone ?? <span className="text-muted-foreground">—</span>}</span>
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
    accessorKey: "form.budgetMinPonctuel",
    id: "budgetMinPonctuel",
    header: "Budget min. ponctuel",
    cell: ({ row }) => {
      const v = row.original.form.budgetMinPonctuel;
      return v != null ? (
        <span>{new Intl.NumberFormat("fr-FR").format(v)} €</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "form.budgetMinMensuel",
    id: "budgetMinMensuel",
    header: "Budget min. retainer",
    cell: ({ row }) => {
      const v = row.original.form.budgetMinMensuel;
      return v != null ? (
        <span>{new Intl.NumberFormat("fr-FR").format(v)} €/mois</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "onboardingCompletedAt",
    header: "Onboardé le",
    cell: ({ row }) => {
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
    cell: ({ row }) => {
      const link = row.original.dashboardLink;
      if (!link) return <span className="text-muted-foreground">—</span>;
      return (
        <Button variant="ghost" size="sm" asChild>
          <a href={link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            <span className="sr-only">Ouvrir le dashboard</span>
          </a>
        </Button>
      );
    },
  },
];

// ─── Entreprise placeholder ──────────────────────────────────────────────────

const ENTREPRISE_COLUMNS: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "company",
    header: "Société",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.company ?? "—"}</span>
    ),
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
    header: "Statut",
    cell: ({ row }) => <StatutBadge statut={row.original.productStatut} />,
  },
  {
    id: "match",
    header: "Match",
    cell: ({ row }) => <MatchingPanel entrepriseId={row.original.id} />,
  },
];

// ─── Main component ──────────────────────────────────────────────────────────

type Tab = "agence" | "entreprise";

export function ClientsTable() {
  const [tab, setTab] = React.useState<Tab>("agence");
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/clients?category=${tab}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ clients: ClientRow[] }>;
      })
      .then(({ clients }) => {
        if (!cancelled) setRows(clients);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Erreur de chargement");
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
          columns={tab === "entreprise" ? ENTREPRISE_COLUMNS : AGENCE_COLUMNS}
          data={rows}
          searchColumn="email"
          searchPlaceholder="Rechercher par email ou société…"
        />
      )}
    </div>
  );
}
