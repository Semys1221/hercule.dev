"use client";

import { useCallback, useEffect, useState } from "react";

import { ManagementEnrollDialog } from "@/components/internal/management/management-enroll-dialog";
import { ManagementRecipientSheet } from "@/components/internal/management/management-recipient-sheet";
import { ManagementRecipientsTable } from "@/components/internal/management/management-recipients-table";
import { ManagementStatusBoard } from "@/components/internal/management/management-status-board";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MANAGEMENT_PHASE_LABELS } from "@/lib/admin/management/recipients/status-labels";
import type {
  EmailSequenceRecipient,
  ManagementPhase,
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

type ManagementShellProps = {
  niche: Niche;
};

export function ManagementShell({ niche }: ManagementShellProps) {
  const [phase, setPhase] = useState<ManagementPhase>("outreach");
  const [statusFilter, setStatusFilter] = useState<RecipientStatus | null>(null);
  const [rows, setRows] = useState<EmailSequenceRecipient[]>([]);
  const [counts, setCounts] = useState<RecipientStatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmailSequenceRecipient | null>(null);
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
        recipients?: EmailSequenceRecipient[];
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
            <Button variant="outline" onClick={() => void loadRows()}>
              Rafraîchir
            </Button>
            <ManagementEnrollDialog niche={niche} phase={phase} onEnrolled={loadRows} />
          </div>
        </div>

        {(Object.keys(MANAGEMENT_PHASE_LABELS) as ManagementPhase[]).map((tabPhase) => (
          <TabsContent key={tabPhase} value={tabPhase} className="mt-0">
            <ManagementRecipientsTable
              rows={rows}
              loading={loading}
              error={error}
              onRowClick={(row) => {
                setSelected(row);
                setSheetOpen(true);
              }}
            />
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
