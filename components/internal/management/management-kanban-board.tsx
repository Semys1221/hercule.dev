"use client";

import { useCallback, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { completeSequenceRecipient } from "@/lib/admin/management/recipients/actions/complete";
import { pauseSequenceRecipient } from "@/lib/admin/management/recipients/actions/pause";
import { resumeSequenceRecipient } from "@/lib/admin/management/recipients/actions/resume";
import { scheduleSequenceRecipient } from "@/lib/admin/management/recipients/actions/schedule";
import { stopSequenceRecipient } from "@/lib/admin/management/recipients/actions/stop";
import { transitionSequenceRecipient } from "@/lib/admin/management/recipients/actions/transition";
import {
  MANAGEMENT_PHASE_LABELS,
  RECIPIENT_STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/admin/management/recipients/status-labels";
import type {
  EmailSequenceRecipient,
  ManagementPhase,
  RecipientListRow,
  RecipientStatus,
} from "@/lib/admin/management/recipients/types";
import type { Niche } from "@/lib/admin/navigation";
import { toast } from "@/hooks/use-toast";

type KanbanView = "status" | "phase";

type ManagementKanbanBoardProps = {
  niche: Niche;
  rows: RecipientListRow[];
  view: KanbanView;
  onRowClick?: (row: EmailSequenceRecipient) => void;
  onUpdated?: () => void;
};

const STATUS_COLUMNS: RecipientStatus[] = [
  "scheduled",
  "active",
  "paused",
  "completed",
  "stopped",
  "failed",
];

const PHASE_COLUMNS: ManagementPhase[] = ["outreach", "booking", "client"];

const TERMINAL_STATUSES = new Set<RecipientStatus>(["completed", "stopped"]);

function defaultClientSlugForNiche(niche: Niche): string {
  if (niche === "comptable") return "comptable-acquisition-post-payment";
  return "onboarding-sequence";
}

function defaultTargetSlugForPhase(
  niche: Niche,
  phase: ManagementPhase,
): string | null {
  if (phase === "booking") {
    return `meeting-${niche}`;
  }
  if (phase === "client") {
    return defaultClientSlugForNiche(niche);
  }
  return "subsequence-interested";
}

export function ManagementKanbanBoard({
  niche,
  rows,
  view,
  onRowClick,
  onUpdated,
}: ManagementKanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    recipientId: string;
    targetStatus: RecipientStatus;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const columns =
    view === "status"
      ? STATUS_COLUMNS.map((status) => ({
          id: status,
          label: RECIPIENT_STATUS_LABELS[status],
          items: rows.filter((row) => row.status === status),
        }))
      : PHASE_COLUMNS.map((phase) => ({
          id: phase,
          label: MANAGEMENT_PHASE_LABELS[phase],
          items: rows.filter((row) => row.phase === phase),
        }));

  const applyStatusDrop = useCallback(
    async (recipientId: string, targetStatus: RecipientStatus) => {
      setBusy(true);
      try {
        if (targetStatus === "paused") {
          const result = await pauseSequenceRecipient({ recipientId });
          if (!result.ok) throw new Error(result.error);
        } else if (targetStatus === "active") {
          const result = await resumeSequenceRecipient({ recipientId });
          if (!result.ok) throw new Error(result.error);
        } else if (targetStatus === "completed") {
          const result = await completeSequenceRecipient({ recipientId });
          if (!result.ok) throw new Error(result.error);
        } else if (targetStatus === "stopped") {
          const result = await stopSequenceRecipient({ recipientId, reason: "kanban_drop" });
          if (!result.ok) throw new Error(result.error);
        } else if (targetStatus === "scheduled") {
          const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          const result = await scheduleSequenceRecipient({ recipientId, scheduledAt });
          if (!result.ok) throw new Error(result.error);
        } else {
          toast({ variant: "destructive", title: "Drop non supporté vers Échec" });
          return;
        }
        toast({ title: "Statut mis à jour" });
        onUpdated?.();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Mise à jour impossible",
          description: error instanceof Error ? error.message : "Erreur",
        });
      } finally {
        setBusy(false);
      }
    },
    [onUpdated],
  );

  const applyPhaseDrop = useCallback(
    async (recipient: RecipientListRow, targetPhase: ManagementPhase) => {
      if (recipient.phase === targetPhase) return;
      const toSlug = defaultTargetSlugForPhase(niche, targetPhase);
      if (!toSlug) return;

      setBusy(true);
      try {
        const result = await transitionSequenceRecipient({
          recipientId: recipient.id,
          toSlug,
        });
        if (!result.ok) throw new Error(result.error);
        toast({ title: "Phase mise à jour" });
        onUpdated?.();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Transition impossible",
          description: error instanceof Error ? error.message : "Erreur",
        });
      } finally {
        setBusy(false);
      }
    },
    [niche, onUpdated],
  );

  function handleDrop(columnId: string, recipient: RecipientListRow) {
    if (busy) return;
    if (view === "status") {
      const targetStatus = columnId as RecipientStatus;
      if (recipient.status === targetStatus) return;
      if (TERMINAL_STATUSES.has(targetStatus)) {
        setPendingConfirm({ recipientId: recipient.id, targetStatus });
        return;
      }
      void applyStatusDrop(recipient.id, targetStatus);
      return;
    }

    void applyPhaseDrop(recipient, columnId as ManagementPhase);
  }

  return (
    <>
      <div className="grid gap-4 overflow-x-auto lg:grid-cols-3 xl:grid-cols-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="min-w-[220px] rounded-lg border border-border bg-muted/30 p-3"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const recipientId = event.dataTransfer.getData("text/recipient-id");
              const recipient = rows.find((row) => row.id === recipientId);
              if (recipient) {
                handleDrop(column.id, recipient);
              }
              setDraggingId(null);
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">{column.label}</h3>
              <Badge variant="secondary">{column.items.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {column.items.map((row) => (
                <Card
                  key={row.id}
                  draggable={!busy}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/recipient-id", row.id);
                    setDraggingId(row.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab active:cursor-grabbing ${
                    draggingId === row.id ? "opacity-50" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="truncate text-xs font-medium">
                      {row.lead_email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 p-3 pt-0">
                    <span className="truncate text-xs text-muted-foreground">
                      {row.sequence_name ?? row.sequence_slug}
                    </span>
                    <Badge variant={statusBadgeVariant(row.status)} className="w-fit text-[10px]">
                      {RECIPIENT_STATUS_LABELS[row.status]}
                    </Badge>
                    <Badge variant="outline" className="w-fit text-[10px] font-normal">
                      {row.provider}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              Passer ce destinataire en «{" "}
              {pendingConfirm
                ? RECIPIENT_STATUS_LABELS[pendingConfirm.targetStatus]
                : ""}
              » arrêtera les jobs en cours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingConfirm) return;
                void applyStatusDrop(pendingConfirm.recipientId, pendingConfirm.targetStatus);
                setPendingConfirm(null);
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
