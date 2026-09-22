"use client";

import { ExternalLink, MoreHorizontal } from "lucide-react";
import * as React from "react";

import type { ColumnDef } from "@/components/legacy/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/legacy/internal/architecture/architecture-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import type { ClientRow } from "@/lib/clients/types";
import type { CreditField, EnginClientRow } from "@/lib/clients/engin-types";
import {
  ELIGIBILITY_LABELS,
  clientEligibility,
  plannedShares,
  type RoundRobinEligibilityReason,
} from "@/lib/clients/round-robin";

import { EnginCalendlyDialog } from "./engin-calendly-dialog";
import { EnginConnectionsDialog } from "./engin-connections-dialog";
import { EnginCreditsDialog } from "./engin-credits-dialog";
import { EnginOnboardingSheet } from "./engin-onboarding-sheet";

const NEW_CLIENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function StatutBadge({ statut }: { statut: string }) {
  const variant =
    statut === "IN_DELIVERANCE" || statut === "SOLD" || statut === "MEETING_BOOKED"
      ? "default"
      : statut === "CANCELLED" || statut === "ARCHIVED"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{statut}</Badge>;
}

function EligibilityBadge({ reason }: { reason: RoundRobinEligibilityReason }) {
  const variant =
    reason === "eligible"
      ? "default"
      : reason === "inactive" || reason === "quota_full"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{ELIGIBILITY_LABELS[reason]}</Badge>;
}

type RowActionsProps = {
  row: EnginClientRow;
  onAdjustCredits: (row: EnginClientRow, field: CreditField) => void;
  onViewOnboarding: (row: EnginClientRow) => void;
  onEditCalendly: (row: EnginClientRow) => void;
  onEditConnections: (row: EnginClientRow) => void;
};

function RowActions({
  row,
  onAdjustCredits,
  onViewOnboarding,
  onEditCalendly,
  onEditConnections,
}: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onAdjustCredits(row, "rdv_used")}>
          Ajuster crédits utilisés
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAdjustCredits(row, "rdv_total")}>
          Ajuster quota RDV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEditConnections(row)}>
          Connexions dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEditCalendly(row)}>
          URL Calendly
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onViewOnboarding(row)}>
          Voir onboarding
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href={`/clients/${encodeURIComponent(row.slug)}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="mr-2 size-4" />
            Ouvrir dashboard
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildColumns(handlers: {
  onAdjustCredits: (row: EnginClientRow, field: CreditField) => void;
  onViewOnboarding: (row: EnginClientRow) => void;
  onEditCalendly: (row: EnginClientRow) => void;
  onEditConnections: (row: EnginClientRow) => void;
}): ColumnDef<EnginClientRow>[] {
  return [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{row.original.email}</span>
          <span className="text-xs text-muted-foreground">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: "first_name",
      header: "Prénom",
      cell: ({ row }) => row.original.first_name ?? "—",
    },
    {
      accessorKey: "client_type",
      header: "Vertical",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.client_type.toUpperCase()}</Badge>
      ),
    },
    {
      accessorKey: "billing",
      header: "Billing",
      cell: ({ row }) =>
        row.original.billing === "monthly" ? "Mensuel" : "Pack",
    },
    {
      accessorKey: "offer_type",
      header: "Offre",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {conferenceOfferLabel(row.original.offer_type)}
        </span>
      ),
    },
    {
      id: "credits",
      header: "Crédits",
      accessorFn: (row) => `${row.rdv_used}/${row.rdv_total}`,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.rdv_used}
          <span className="text-muted-foreground"> / {row.original.rdv_total}</span>
        </span>
      ),
    },
    {
      id: "rrShare",
      header: "Part RR",
      accessorFn: (row) => row.rrSharePct,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.rrSharePct.toLocaleString("fr-FR", {
            maximumFractionDigits: 1,
            minimumFractionDigits: 0,
          })}
          %
        </span>
      ),
    },
    {
      id: "eligibility",
      header: "Pool",
      accessorFn: (row) => row.eligibility,
      cell: ({ row }) => <EligibilityBadge reason={row.original.eligibility} />,
    },
    {
      accessorKey: "first_lead_at",
      header: "First lead",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {row.original.first_lead_at
            ? new Date(row.original.first_lead_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "product_statut",
      header: "Statut",
      cell: ({ row }) => <StatutBadge statut={row.original.product_statut} />,
    },
    {
      accessorKey: "created_at",
      header: "Créé le",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <RowActions
          row={row.original}
          onAdjustCredits={handlers.onAdjustCredits}
          onViewOnboarding={handlers.onViewOnboarding}
          onEditCalendly={handlers.onEditCalendly}
          onEditConnections={handlers.onEditConnections}
        />
      ),
    },
  ];
}

export function EnginClientsTable() {
  const [rows, setRows] = React.useState<EnginClientRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [vertical, setVertical] = React.useState<string>("all");
  const [nouveauxOnly, setNouveauxOnly] = React.useState(false);

  const [creditsTarget, setCreditsTarget] = React.useState<{
    client: EnginClientRow;
    field: CreditField;
  } | null>(null);
  const [onboardingTarget, setOnboardingTarget] = React.useState<EnginClientRow | null>(
    null,
  );
  const [calendlyTarget, setCalendlyTarget] = React.useState<EnginClientRow | null>(
    null,
  );
  const [connectionsTarget, setConnectionsTarget] = React.useState<EnginClientRow | null>(
    null,
  );

  const mergeClient = React.useCallback((prev: EnginClientRow[], client: ClientRow) => {
    const nextRows = prev.map((row) =>
      row.id === client.id ? { ...row, ...client } : row,
    );
    const shares = plannedShares(nextRows);
    return nextRows.map((row) => ({
      ...row,
      rrSharePct: shares.get(row.id)?.sharePct ?? 0,
      eligibility: clientEligibility(row),
    }));
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/engin/clients");
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Échec du chargement",
        );
      }
      setRows((body.clients ?? []) as EnginClientRow[]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible de charger les clients",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const now = Date.now();
    return rows.filter((row) => {
      if (vertical !== "all" && row.client_type !== vertical) {
        return false;
      }
      if (nouveauxOnly) {
        const created = new Date(row.created_at).getTime();
        if (Number.isNaN(created) || now - created > NEW_CLIENT_WINDOW_MS) {
          return false;
        }
      }
      if (!needle) {
        return true;
      }
      return (
        row.email.toLowerCase().includes(needle) ||
        row.slug.toLowerCase().includes(needle) ||
        (row.first_name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, search, vertical, nouveauxOnly]);

  const columns = React.useMemo(
    () =>
      buildColumns({
        onAdjustCredits: (client, field) => setCreditsTarget({ client, field }),
        onViewOnboarding: (client) => setOnboardingTarget(client),
        onEditCalendly: (client) => setCalendlyTarget(client),
        onEditConnections: (client) => setConnectionsTarget(client),
      }),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher email, slug, prénom…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Select value={vertical} onValueChange={setVertical}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Vertical" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="dec">DEC</SelectItem>
            <SelectItem value="cif">CIF</SelectItem>
            <SelectItem value="ias">IAS</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={nouveauxOnly ? "default" : "outline"}
          onClick={() => setNouveauxOnly((value) => !value)}
        >
          Nouveaux (7j)
        </Button>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Actualiser
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des clients…</p>
      ) : (
        <ArchitectureDataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
        />
      )}

      <EnginCreditsDialog
        client={creditsTarget?.client ?? null}
        field={creditsTarget?.field ?? null}
        open={Boolean(creditsTarget)}
        onOpenChange={(open) => {
          if (!open) setCreditsTarget(null);
        }}
        onUpdated={(client) => {
          setRows((prev) => mergeClient(prev, client));
        }}
      />

      <EnginConnectionsDialog
        client={connectionsTarget}
        open={Boolean(connectionsTarget)}
        onOpenChange={(open) => {
          if (!open) setConnectionsTarget(null);
        }}
        onUpdated={(client) => {
          setRows((prev) => mergeClient(prev, client));
        }}
      />

      <EnginCalendlyDialog
        client={calendlyTarget}
        open={Boolean(calendlyTarget)}
        onOpenChange={(open) => {
          if (!open) setCalendlyTarget(null);
        }}
        onUpdated={(client) => {
          setRows((prev) => mergeClient(prev, client));
        }}
      />

      <EnginOnboardingSheet
        clientId={onboardingTarget?.id ?? null}
        clientLabel={
          onboardingTarget
            ? `${onboardingTarget.email} (${onboardingTarget.slug})`
            : null
        }
        open={Boolean(onboardingTarget)}
        onOpenChange={(open) => {
          if (!open) setOnboardingTarget(null);
        }}
      />
    </div>
  );
}
