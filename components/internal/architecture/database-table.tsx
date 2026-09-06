"use client";

import { ArrowUpDown } from "lucide-react";
import * as React from "react";

import {
  ArchitectureDataTable,
  type ColumnDef,
} from "@/components/internal/architecture/architecture-data-table";
import { DomainBadge } from "@/components/internal/architecture/domain-badge";
import { StatusBadge } from "@/components/internal/architecture/status-badge";
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
import { getDatabaseRegistry } from "@/lib/admin/architecture/database-registry";
import {
  DATABASE_DOMAIN_LABELS,
  type DatabaseDomain,
  type DatabaseEntry,
} from "@/lib/admin/architecture/types";

function TruncatedCell({ value }: { value: string }) {
  if (!value || value === "—") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="block max-w-[240px] truncate" title={value}>
      {value}
    </span>
  );
}

function ActorList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="capitalize">
          {value}
        </Badge>
      ))}
    </div>
  );
}

const columns: ColumnDef<DatabaseEntry, unknown>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Table
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <code className="text-xs">{row.getValue("id") as string}</code>
    ),
  },
  {
    accessorKey: "label",
    header: "Libellé",
  },
  {
    accessorKey: "domain",
    header: "Domaine",
    cell: ({ row }) => (
      <DomainBadge domain={row.getValue("domain") as DatabaseDomain} />
    ),
  },
  {
    accessorKey: "purpose",
    header: "Rôle",
    cell: ({ row }) => <TruncatedCell value={row.getValue("purpose") as string} />,
  },
  {
    accessorKey: "keyColumns",
    header: "Colonnes clés",
    cell: ({ row }) => (
      <TruncatedCell value={row.getValue("keyColumns") as string} />
    ),
  },
  {
    accessorKey: "writers",
    header: "Writers",
    cell: ({ row }) => (
      <ActorList values={row.getValue("writers") as string[]} />
    ),
  },
  {
    accessorKey: "readers",
    header: "Readers",
    cell: ({ row }) => (
      <ActorList values={row.getValue("readers") as string[]} />
    ),
  },
  {
    accessorKey: "profileKeys",
    header: "Profile keys",
    cell: ({ row }) => (
      <TruncatedCell value={(row.getValue("profileKeys") as string) ?? "—"} />
    ),
  },
  {
    accessorKey: "relatedTables",
    header: "Tables liées",
    cell: ({ row }) => {
      const related = row.getValue("relatedTables") as string[];
      if (!related.length) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {related.map((table) => (
            <Badge key={table} variant="outline" className="font-mono text-xs">
              {table}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue("status") as DatabaseEntry["status"]} />
    ),
  },
];

export function DatabaseTable() {
  const data = React.useMemo(() => getDatabaseRegistry(), []);
  const [domainFilter, setDomainFilter] = React.useState<DatabaseDomain[]>([]);

  const filteredData = React.useMemo(() => {
    if (domainFilter.length === 0) {
      return data;
    }
    return data.filter((entry) => domainFilter.includes(entry.domain));
  }, [data, domainFilter]);

  const toggleDomain = (value: DatabaseDomain) => {
    setDomainFilter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <ArchitectureDataTable
      columns={columns}
      data={filteredData}
      searchColumn="id"
      searchPlaceholder="Rechercher une table…"
      toolbar={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Domaine
              {domainFilter.length > 0 ? ` (${domainFilter.length})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Domaine</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.entries(DATABASE_DOMAIN_LABELS) as [DatabaseDomain, string][]).map(
              ([value, label]) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={domainFilter.includes(value)}
                  onCheckedChange={() => toggleDomain(value)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  );
}
