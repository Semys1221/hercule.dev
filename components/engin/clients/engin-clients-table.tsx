"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import type { ColumnDef } from "@/components/legacy/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/legacy/internal/architecture/architecture-data-table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { isCalendarConnected } from "@/lib/clients/dashboard-connections";
import { renewalAdminLabel } from "@/lib/clients/monthly-renewal-announcement";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import type { EnginClientRow } from "@/lib/clients/engin-types";
import {
  ELIGIBILITY_LABELS,
  type RoundRobinEligibilityReason,
} from "@/lib/clients/round-robin";
import { parseClientVideoConference } from "@/lib/clients/video-conference";

const NEW_CLIENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function StatutBadge({ statut }: { statut: string }) {
  const variant =
    statut === "IN_DELIVERANCE" ||
    statut === "SOLD" ||
    statut === "MEETING_BOOKED" ||
    statut === "FREE_TRIAL"
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

function clientHref(id: string) {
  return `/admin/clients/${encodeURIComponent(id)}`;
}

function ConnectionBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className="tabular-nums">
      {ok ? "Oui" : "Non"}
    </Badge>
  );
}

export function EnginClientsTable() {
  const router = useRouter();
  const [rows, setRows] = React.useState<EnginClientRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [vertical, setVertical] = React.useState<string>("all");
  const [nouveauxOnly, setNouveauxOnly] = React.useState(false);
  const [needsOpsOnly, setNeedsOpsOnly] = React.useState(false);
  const [trialOnly, setTrialOnly] = React.useState(false);
  const [filtersMounted, setFiltersMounted] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/engin/clients");
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof body.error === "string" ? body.error : "Échec du chargement");
      }
      const body = (await response.json()) as { clients?: EnginClientRow[] };
      setRows(body.clients ?? []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible de charger les clients",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    setFiltersMounted(true);
  }, []);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const now = Date.now();
    return rows.filter((row) => {
      if (vertical !== "all" && row.client_type !== vertical) return false;
      if (needsOpsOnly && !row.needsOps) return false;
      if (trialOnly && !row.product_statut.startsWith("FREE_TRIAL")) return false;
      if (nouveauxOnly) {
        const created = new Date(row.created_at).getTime();
        if (Number.isNaN(created) || now - created > NEW_CLIENT_WINDOW_MS) return false;
      }
      if (!needle) return true;
      return (
        row.email.toLowerCase().includes(needle) ||
        row.slug.toLowerCase().includes(needle) ||
        (row.first_name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, search, vertical, nouveauxOnly, needsOpsOnly, trialOnly]);

  const filteredIds = React.useMemo(() => filtered.map((row) => row.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected =
    filteredIds.some((id) => selectedIds.has(id)) && !allFilteredSelected;
  const selectionCount = selectedIds.size;

  const toggleSelectAllFiltered = React.useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }, [allFilteredSelected, filteredIds]);

  const toggleRow = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  async function handleBulkDelete() {
    if (selectionCount === 0 || bulkDeleting) return;
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/admin/engin/clients/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        deleted?: { id: string; slug: string }[];
        failed?: { id: string; error: string }[];
      };
      if (!response.ok && !body.deleted?.length) {
        throw new Error(body.error ?? "Suppression impossible");
      }
      const deletedCount = body.deleted?.length ?? 0;
      const failed = body.failed ?? [];
      setSelectedIds(new Set());
      await load();
      if (failed.length > 0) {
        toast({
          variant: "destructive",
          title: `${deletedCount} supprimé(s), ${failed.length} échec(s)`,
          description: failed.map((f) => f.error).join(" · "),
        });
      } else {
        toast({
          title: "Clients supprimés",
          description: `${deletedCount} client(s) retiré(s) définitivement.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setBulkDeleting(false);
    }
  }

  const columns = React.useMemo<ColumnDef<EnginClientRow>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
            onCheckedChange={() => toggleSelectAllFiltered()}
            aria-label="Sélectionner tous les clients filtrés"
            onClick={(event) => event.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(checked) => toggleRow(row.original.id, checked === true)}
            aria-label={`Sélectionner ${row.original.email}`}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <Link
              href={clientHref(row.original.id)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {row.original.email}
            </Link>
            <Link
              href={clientHref(row.original.id)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {row.original.slug}
            </Link>
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
        cell: ({ row }) => (row.original.billing === "monthly" ? "Mensuel" : "Pack"),
      },
      {
        id: "calendar",
        header: "Cal.",
        cell: ({ row }) => (
          <ConnectionBadge ok={isCalendarConnected(row.original.profile)} />
        ),
      },
      {
        id: "visio",
        header: "Visio",
        cell: ({ row }) => (
          <ConnectionBadge ok={parseClientVideoConference(row.original.profile) != null} />
        ),
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
        id: "eligibility",
        header: "Pool",
        accessorFn: (row) => row.eligibility,
        cell: ({ row }) => <EligibilityBadge reason={row.original.eligibility} />,
      },
      {
        accessorKey: "product_statut",
        header: "Statut",
        cell: ({ row }) => <StatutBadge statut={row.original.product_statut} />,
      },
      {
        id: "renewal",
        header: "Renouvellement",
        accessorFn: (row) => renewalAdminLabel(row),
        cell: ({ row }) => (
          <span className="text-sm">{renewalAdminLabel(row.original)}</span>
        ),
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
    ],
    [
      allFilteredSelected,
      someFilteredSelected,
      selectedIds,
      toggleSelectAllFiltered,
      toggleRow,
    ],
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
        {filtersMounted ? (
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
        ) : (
          <div
            className="flex h-9 w-[140px] items-center rounded-md border border-input px-3 text-sm text-muted-foreground"
            aria-hidden
          >
            Tous
          </div>
        )}
        <Button
          type="button"
          variant={needsOpsOnly ? "default" : "outline"}
          onClick={() => setNeedsOpsOnly((value) => !value)}
        >
          À traiter
        </Button>
        <Button
          type="button"
          variant={trialOnly ? "default" : "outline"}
          onClick={() => setTrialOnly((value) => !value)}
        >
          Essais
        </Button>
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
        {selectionCount > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={bulkDeleting}>
                Supprimer la sélection ({selectionCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer {selectionCount} client(s) ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Action irréversible : paiements, rendez-vous, siège Calendly, jobs email et
                  tâches associés seront supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void handleBulkDelete()}
                >
                  Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des clients…</p>
      ) : (
        <ArchitectureDataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(clientHref(row.id))}
        />
      )}
    </div>
  );
}
