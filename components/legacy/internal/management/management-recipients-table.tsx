"use client";

import * as React from "react";

import type { ColumnDef } from "@/components/legacy/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/legacy/internal/architecture/architecture-data-table";
import { Badge } from "@/components/ui/badge";
import {
  RECIPIENT_STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/legacy/admin/management/recipients/status-labels";
import type {
  EmailSequenceRecipient,
  RecipientListRow,
} from "@/lib/legacy/admin/management/recipients/types";
import Link from "next/link";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columns: ColumnDef<RecipientListRow>[] = [
  {
    accessorKey: "lead_email",
    header: "Email",
    cell: ({ row }) => <span className="font-medium">{row.original.lead_email}</span>,
  },
  {
    accessorKey: "sequence_slug",
    header: "Séquence",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.sequence_slug}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={statusBadgeVariant(row.original.status)}>
        {RECIPIENT_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "current_step",
    header: "Étape",
    cell: ({ row }) => row.original.current_step ?? "—",
  },
  {
    accessorKey: "provider",
    header: "Provider",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.original.provider}
      </Badge>
    ),
  },
  {
    accessorKey: "scheduled_at",
    header: "Planifié",
    cell: ({ row }) => formatDate(row.original.scheduled_at),
  },
  {
    id: "cockpit",
    header: "Cockpit",
    cell: ({ row }) =>
      row.original.cockpit_href ? (
        <Link
          href={row.original.cockpit_href}
          className="text-sm text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          Ouvrir
        </Link>
      ) : (
        "—"
      ),
  },
];

type ManagementRecipientsTableProps = {
  rows: RecipientListRow[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: EmailSequenceRecipient) => void;
};

export function ManagementRecipientsTable({
  rows,
  loading,
  error,
  onRowClick,
}: ManagementRecipientsTableProps) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <ArchitectureDataTable
      columns={columns}
      data={rows}
      searchColumn="lead_email"
      searchPlaceholder="Rechercher un email…"
      onRowClick={onRowClick}
      getRowId={(row) => row.id}
    />
  );
}
