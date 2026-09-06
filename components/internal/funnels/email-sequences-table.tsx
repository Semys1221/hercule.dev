"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import * as React from "react";

import {
  ArchitectureDataTable,
  type ColumnDef,
} from "@/components/internal/architecture/architecture-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getEmailSequences,
  emailSequenceHref,
  PHASE_LABELS,
  type EmailSequenceEntry,
  type EmailSequencePhase,
} from "@/lib/admin/email-sequences/registry";
import type { Audience } from "@/lib/admin/navigation";

const PROVIDER_LABELS: Record<EmailSequenceEntry["provider"], string> = {
  resend: "Resend",
  instantly: "Instantly",
  hybrid: "Hybride",
};

type EmailSequencesTableProps = {
  audience: Audience;
};

export function EmailSequencesTable({ audience }: EmailSequencesTableProps) {
  const router = useRouter();
  const sequences = React.useMemo(() => getEmailSequences(audience), [audience]);
  const [phaseFilter, setPhaseFilter] = React.useState<EmailSequencePhase[]>([]);

  const filteredSequences = React.useMemo(() => {
    if (phaseFilter.length === 0) {
      return sequences;
    }
    return sequences.filter((entry) => phaseFilter.includes(entry.phase));
  }, [sequences, phaseFilter]);

  const columns = React.useMemo<ColumnDef<EmailSequenceEntry, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "phase",
        header: "Phase",
        cell: ({ row }) => (
          <Badge variant={row.original.phase === "pre_close" ? "default" : "secondary"}>
            {PHASE_LABELS[row.original.phase]}
          </Badge>
        ),
        filterFn: (row, id, value: EmailSequencePhase[]) => {
          if (!value?.length) return true;
          return value.includes(row.getValue(id) as EmailSequencePhase);
        },
      },
      {
        accessorKey: "category",
        header: "Catégorie",
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("category") as string}</Badge>
        ),
      },
      {
        accessorKey: "stepCount",
        header: "Steps",
        cell: ({ row }) => {
          const count = row.original.stepCount;
          return count > 0 ? count : "—";
        },
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "built" ? "default" : "outline"}>
            {row.original.status === "built" ? "Built" : "Spec"}
          </Badge>
        ),
      },
      {
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => PROVIDER_LABELS[row.original.provider],
      },
    ],
    [],
  );

  const phaseToolbar = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Phase
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Filtrer par phase</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(PHASE_LABELS) as EmailSequencePhase[]).map((phase) => (
          <DropdownMenuCheckboxItem
            key={phase}
            checked={phaseFilter.includes(phase)}
            onCheckedChange={(checked) => {
              setPhaseFilter((prev) =>
                checked ? [...prev, phase] : prev.filter((p) => p !== phase),
              );
            }}
          >
            {PHASE_LABELS[phase]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <ArchitectureDataTable
      columns={columns}
      data={filteredSequences}
      searchColumn="name"
      searchPlaceholder="Rechercher une séquence…"
      toolbar={phaseToolbar}
      footer={
        <p className="text-xs text-muted-foreground">
          {filteredSequences.length} séquence{filteredSequences.length > 1 ? "s" : ""} — cliquez sur une ligne pour éditer.
        </p>
      }
      onRowClick={(row) => {
        router.push(emailSequenceHref(audience, row.slug));
      }}
    />
  );
}
