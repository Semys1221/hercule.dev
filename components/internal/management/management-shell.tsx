"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ManagementEnrollDialog } from "@/components/internal/management/management-enroll-dialog";
import { ManagementKanbanBoard } from "@/components/internal/management/management-kanban-board";
import { ManagementRecipientSheet } from "@/components/internal/management/management-recipient-sheet";
import { ManagementRecipientsTable } from "@/components/internal/management/management-recipients-table";
import { ManagementStatusBoard } from "@/components/internal/management/management-status-board";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MANAGEMENT_PHASE_LABELS } from "@/lib/admin/management/recipients/status-labels";
import type {
  EmailSequenceRecipient,
  ManagementPhase,
  RecipientListRow,
  RecipientStatus,
  RecipientStatusCounts,
} from "@/lib/admin/management/recipients/types";
import type { Niche } from "@/lib/admin/navigation";

const EMPTY_COUNTS: RecipientStatusCounts = {
  scheduled: 0,
  active: 0,
  paused: 0,
  completed: 0,
  stopped: 0,
  failed: 0,
};

type ViewMode = "table" | "kanban-status" | "kanban-phase";

type ManagementShellProps = {
  niche: Niche;
};

export function ManagementShell({ niche }: ManagementShellProps) {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<ManagementPhase>("outreach");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<RecipientStatus | null>(null);
  const [rows, setRows] = useState<RecipientListRow[]>([]);
  const [counts, setCounts] = useState<RecipientStatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecipientListRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ niche, phase });
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/admin/management/recipients?${params}`);
      const body = (await response.json()) as {
        recipients?: RecipientListRow[];
        counts?: RecipientStatusCounts;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      setRows(body.recipients ?? []);
      setCounts(body.counts ?? EMPTY_COUNTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setRows([]);
      setCounts(EMPTY_COUNTS);
    } finally {
      setLoading(false);
    }
  }, [niche, phase, statusFilter]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    const recipientId = searchParams.get("recipient");
    if (!recipientId || rows.length === 0) return;
    const match = rows.find((row) => row.id === recipientId);
    if (match) {
      setSelected(match);
      setSheetOpen(true);
    }
  }, [searchParams, rows]);

  function handleRowClick(row: EmailSequenceRecipient) {
    setSelected(row as RecipientListRow);
    setSheetOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <ManagementStatusBoard
        counts={counts}
        activeStatus={statusFilter}
        onStatusClick={setStatusFilter}
      />

      <Tabs
        value={phase}
        onValueChange={(value) => setPhase(value as ManagementPhase)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            {(Object.keys(MANAGEMENT_PHASE_LABELS) as ManagementPhase[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {MANAGEMENT_PHASE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
            >
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="kanban-status">Kanban statuts</TabsTrigger>
                <TabsTrigger value="kanban-phase">Kanban phases</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={() => void loadRows()}>
              Rafraîchir
            </Button>
            <ManagementEnrollDialog niche={niche} phase={phase} onEnrolled={loadRows} />
          </div>
        </div>

        {(Object.keys(MANAGEMENT_PHASE_LABELS) as ManagementPhase[]).map((tabPhase) => (
          <TabsContent key={tabPhase} value={tabPhase} className="mt-0">
            {viewMode === "table" ? (
              <ManagementRecipientsTable
                rows={rows}
                loading={loading}
                error={error}
                onRowClick={handleRowClick}
              />
            ) : (
              <ManagementKanbanBoard
                niche={niche}
                rows={rows}
                view={viewMode === "kanban-status" ? "status" : "phase"}
                onRowClick={handleRowClick}
                onUpdated={loadRows}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ManagementRecipientSheet
        recipient={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={loadRows}
      />
    </div>
  );
}
