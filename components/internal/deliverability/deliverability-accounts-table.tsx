"use client";

import * as React from "react";

import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import { DeliverabilityHealthBadge } from "@/components/internal/deliverability/deliverability-health-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  DeliverabilityAccountRow,
  DeliverabilityHealth,
} from "@/lib/admin/deliverability/types";

type HealthFilter = "all" | DeliverabilityHealth;

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)} %`;
}

function vitalsBadge(ok: boolean | undefined, label: string) {
  if (ok === undefined) return <Badge variant="outline">{label} ?</Badge>;
  return (
    <Badge variant={ok ? "secondary" : "destructive"}>
      {label} {ok ? "OK" : "KO"}
    </Badge>
  );
}

export function DeliverabilityAccountsTable({
  accounts,
  selectedEmail,
  onSelect,
  onRefreshVitals,
}: {
  accounts: DeliverabilityAccountRow[];
  selectedEmail: string | null;
  onSelect: (email: string) => void;
  onRefreshVitals: (email: string) => void;
}) {
  const [filter, setFilter] = React.useState<HealthFilter>("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return accounts;
    return accounts.filter((row) => row.health === filter);
  }, [accounts, filter]);

  const columns = React.useMemo<ColumnDef<DeliverabilityAccountRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Inbox",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.email}</span>
            <span className="text-xs text-muted-foreground">{row.original.domain}</span>
          </div>
        ),
      },
      {
        accessorKey: "health",
        header: "Santé",
        cell: ({ row }) => <DeliverabilityHealthBadge health={row.original.health} />,
      },
      {
        accessorKey: "statusLabel",
        header: "Statut",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.statusLabel}</Badge>
        ),
      },
      {
        id: "warmup",
        header: "Warmup",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.warmupStatusLabel}
          </span>
        ),
      },
      {
        id: "healthScore",
        header: "Score",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.warmup.healthScore ?? "—"}
          </span>
        ),
      },
      {
        id: "inboxRate",
        header: "Inbox %",
        cell: ({ row }) => formatPercent(row.original.warmup.inboxRate),
      },
      {
        id: "spamRate",
        header: "Spam %",
        cell: ({ row }) => {
          const inbox = row.original.warmup.inboxRate;
          if (inbox === null) return "—";
          return formatPercent(1 - inbox);
        },
      },
      {
        id: "vitals",
        header: "DNS",
        cell: ({ row }) => {
          const v = row.original.vitals;
          if (!v) return <Badge variant="outline">Non testé</Badge>;
          return (
            <div className="flex flex-wrap gap-1">
              {vitalsBadge(v.mx, "MX")}
              {vitalsBadge(v.spf, "SPF")}
              {vitalsBadge(v.dkim, "DKIM")}
              {vitalsBadge(v.dmarc, "DMARC")}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onSelect(row.original.email)}
            >
              Contrôler
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onRefreshVitals(row.original.email)}
            >
              DNS
            </Button>
          </div>
        ),
      },
    ],
    [onRefreshVitals, onSelect],
  );

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(value) => value && setFilter(value as HealthFilter)}
        variant="outline"
      >
        <ToggleGroupItem value="all">Tous ({accounts.length})</ToggleGroupItem>
        <ToggleGroupItem value="critical">Critique</ToggleGroupItem>
        <ToggleGroupItem value="watch">Surveillance</ToggleGroupItem>
        <ToggleGroupItem value="paused">Pause</ToggleGroupItem>
        <ToggleGroupItem value="error">Erreur</ToggleGroupItem>
      </ToggleGroup>

      <ArchitectureDataTable
        columns={columns}
        data={filtered}
        searchColumn="email"
        searchPlaceholder="Rechercher une inbox…"
        onRowClick={(row) => onSelect(row.email)}
        getRowId={(row) => row.email}
        selectedRowId={selectedEmail}
      />
    </div>
  );
}
