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
import { getComponentsRegistry } from "@/lib/admin/architecture/components-registry";
import {
  COMPONENT_DOMAIN_LABELS,
  COMPONENT_KIND_LABELS,
  COMPONENT_ROLE_LABELS,
  type ComponentDomain,
  type ComponentEntry,
  type ComponentRole,
} from "@/lib/admin/architecture/types";

function TruncatedCell({ value }: { value: string }) {
  if (!value || value === "—") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="block max-w-[220px] truncate" title={value}>
      {value}
    </span>
  );
}

const columns: ColumnDef<ComponentEntry, unknown>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <code className="text-xs">{row.getValue("id") as string}</code>
    ),
  },
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
  },
  {
    accessorKey: "kind",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {COMPONENT_KIND_LABELS[row.getValue("kind") as ComponentEntry["kind"]]}
      </Badge>
    ),
  },
  {
    accessorKey: "domain",
    header: "Domaine",
    cell: ({ row }) => (
      <DomainBadge domain={row.getValue("domain") as ComponentDomain} />
    ),
    filterFn: (row, id, value: ComponentDomain[]) => {
      if (!value?.length) return true;
      return value.includes(row.getValue(id) as ComponentDomain);
    },
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => (
      <Badge variant="outline">
        {COMPONENT_ROLE_LABELS[row.getValue("role") as ComponentRole]}
      </Badge>
    ),
    filterFn: (row, id, value: ComponentRole[]) => {
      if (!value?.length) return true;
      return value.includes(row.getValue(id) as ComponentRole);
    },
  },
  {
    accessorKey: "actor",
    header: "Acteur",
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue("actor") as string}</span>
    ),
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => <TruncatedCell value={row.getValue("route") as string} />,
  },
  {
    accessorKey: "dataIn",
    header: "Data in",
    cell: ({ row }) => <TruncatedCell value={row.getValue("dataIn") as string} />,
  },
  {
    accessorKey: "dataOut",
    header: "Data out",
    cell: ({ row }) => <TruncatedCell value={row.getValue("dataOut") as string} />,
  },
  {
    accessorKey: "sideEffects",
    header: "Side effects",
    cell: ({ row }) => (
      <TruncatedCell value={row.getValue("sideEffects") as string} />
    ),
  },
  {
    accessorKey: "storage",
    header: "Storage",
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue("storage") as string}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue("status") as ComponentEntry["status"]} />
    ),
  },
];

type MultiFilterProps<T extends string> = {
  label: string;
  options: Record<T, string>;
  selected: T[];
  onChange: (values: T[]) => void;
};

function MultiFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiFilterProps<T>) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {label}
          {selected.length > 0 ? ` (${selected.length})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.entries(options) as [T, string][]).map(([value, optionLabel]) => (
          <DropdownMenuCheckboxItem
            key={value}
            checked={selected.includes(value)}
            onCheckedChange={() => toggle(value)}
          >
            {optionLabel}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ComponentsTable() {
  const data = React.useMemo(() => getComponentsRegistry(), []);
  const [search, setSearch] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState<ComponentDomain[]>([]);
  const [roleFilter, setRoleFilter] = React.useState<ComponentRole[]>([]);

  const filteredData = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((entry) => {
      const domainMatch =
        domainFilter.length === 0 || domainFilter.includes(entry.domain);
      const roleMatch =
        roleFilter.length === 0 || roleFilter.includes(entry.role);
      const searchMatch =
        query.length === 0 ||
        entry.id.toLowerCase().includes(query) ||
        entry.name.toLowerCase().includes(query);
      return domainMatch && roleMatch && searchMatch;
    });
  }, [data, domainFilter, roleFilter, search]);

  return (
    <ArchitectureDataTable
      columns={columns}
      data={filteredData}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Rechercher par nom ou id…"
      toolbar={
        <>
          <MultiFilter
            label="Domaine"
            options={COMPONENT_DOMAIN_LABELS}
            selected={domainFilter}
            onChange={setDomainFilter}
          />
          <MultiFilter
            label="Rôle"
            options={COMPONENT_ROLE_LABELS}
            selected={roleFilter}
            onChange={setRoleFilter}
          />
        </>
      }
      footer={
        <p className="text-xs text-muted-foreground">
          Phase 2 : matrice des transitions d&apos;état (from → to → side effects).
        </p>
      }
    />
  );
}
