"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildManagementHref } from "@/lib/admin/management/recipients/cockpit-link";
import {
  RECIPIENT_STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/admin/management/recipients/status-labels";
import type { RecipientListRow } from "@/lib/admin/management/recipients/types";
import type { ClientCockpitData } from "@/lib/admin/clients/types";

type CockpitSequencesPanelProps = {
  data: ClientCockpitData;
};

export function CockpitSequencesPanel({ data }: CockpitSequencesPanelProps) {
  const [rows, setRows] = useState<RecipientListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        niche: data.category,
        leadEmail: data.email,
      });
      const response = await fetch(`/api/admin/management/recipients?${params}`);
      const body = (await response.json()) as {
        recipients?: RecipientListRow[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      setRows(body.recipients ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [data.category, data.email]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Chargement des séquences…</p>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const activeRows = rows.filter(
    (row) => row.status === "active" || row.status === "scheduled" || row.status === "paused",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {activeRows.length} inscription(s) active(s) sur {rows.length} au total
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={buildManagementHref(data.category)}>
            Gérer dans Management
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune séquence enregistrée.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-medium">
                  {row.sequence_name ?? row.sequence_slug}
                </span>
                <span className="text-xs text-muted-foreground">{row.phase}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(row.status)}>
                  {RECIPIENT_STATUS_LABELS[row.status]}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={buildManagementHref(data.category, row.id)}>Détail</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
