"use client";

import Link from "next/link";
import { useState } from "react";

import { completeSequenceRecipient } from "@/lib/legacy/admin/management/recipients/actions/complete";
import { pauseSequenceRecipient } from "@/lib/legacy/admin/management/recipients/actions/pause";
import { resumeSequenceRecipient } from "@/lib/legacy/admin/management/recipients/actions/resume";
import { scheduleSequenceRecipient } from "@/lib/legacy/admin/management/recipients/actions/schedule";
import { stopSequenceRecipient } from "@/lib/legacy/admin/management/recipients/actions/stop";
import {
  MANAGEMENT_PHASE_LABELS,
  RECIPIENT_STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/legacy/admin/management/recipients/status-labels";
import type { RecipientListRow } from "@/lib/legacy/admin/management/recipients/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";

type ManagementRecipientSheetProps = {
  recipient: RecipientListRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ManagementRecipientSheet({
  recipient,
  open,
  onOpenChange,
  onUpdated,
}: ManagementRecipientSheetProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePause() {
    if (!recipient) return;
    setBusy(true);
    try {
      const result = await pauseSequenceRecipient({ recipientId: recipient.id });
      if (!result.ok) throw new Error(result.error);
      toast({ title: "Séquence en pause", description: `${result.jobsCancelled} job(s) annulé(s)` });
      onUpdated?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Pause impossible",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResume() {
    if (!recipient) return;
    setBusy(true);
    try {
      const result = await resumeSequenceRecipient({ recipientId: recipient.id });
      if (!result.ok) throw new Error(result.error);
      toast({
        title: "Séquence reprise",
        description: result.jobRescheduled ? "Job replanifié" : "Statut actif",
      });
      onUpdated?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reprise impossible",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!recipient) return;
    setBusy(true);
    try {
      const result = await stopSequenceRecipient({
        recipientId: recipient.id,
        reason: "manual_stop",
      });
      if (!result.ok) throw new Error(result.error);
      toast({ title: "Séquence arrêtée", description: `${result.jobsCancelled} job(s) annulé(s)` });
      onUpdated?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Arrêt impossible",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!recipient) return;
    setBusy(true);
    try {
      const result = await completeSequenceRecipient({
        recipientId: recipient.id,
        reason: "manual_complete",
      });
      if (!result.ok) throw new Error(result.error);
      toast({
        title: "Séquence terminée",
        description: `${result.jobsCancelled} job(s) annulé(s)`,
      });
      onUpdated?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clôture impossible",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSchedule() {
    if (!recipient || !scheduledAt) {
      toast({ variant: "destructive", title: "Date requise" });
      return;
    }
    setBusy(true);
    try {
      const result = await scheduleSequenceRecipient({
        recipientId: recipient.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      if (!result.ok) throw new Error(result.error);
      toast({
        title: "Planification enregistrée",
        description: result.jobRescheduled ? "Job reschedulé" : "Statut mis à jour",
      });
      onUpdated?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Planification impossible",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{recipient?.lead_email ?? "Destinataire"}</SheetTitle>
          <SheetDescription>
            {recipient ? MANAGEMENT_PHASE_LABELS[recipient.phase] : ""} —{" "}
            {recipient?.sequence_name ?? recipient?.sequence_slug}
          </SheetDescription>
        </SheetHeader>

        {recipient ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant(recipient.status)}>
                {RECIPIENT_STATUS_LABELS[recipient.status]}
              </Badge>
              <Badge variant="outline">{recipient.provider}</Badge>
            </div>

            {recipient.cockpit_href ? (
              <Button variant="outline" asChild>
                <Link href={recipient.cockpit_href}>Ouvrir cockpit</Link>
              </Button>
            ) : null}

            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Étape</dt>
                <dd className="font-medium">{recipient.current_step ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Planifié</dt>
                <dd>{formatDate(recipient.scheduled_at)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Démarré</dt>
                <dd>{formatDate(recipient.started_at)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Campagne</dt>
                <dd className="truncate font-mono text-xs">{recipient.campaign_id ?? "—"}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handlePause}
                  disabled={busy || recipient.status === "paused"}
                >
                  Pause
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResume}
                  disabled={busy || recipient.status !== "paused"}
                >
                  Reprendre
                </Button>
                <Button
                  variant="outline"
                  onClick={handleComplete}
                  disabled={busy || recipient.status === "completed"}
                >
                  Terminer
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStop}
                  disabled={busy || recipient.status === "stopped"}
                >
                  Arrêter
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sheet-schedule">Replanifier</Label>
                <Input
                  id="sheet-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
                <Button onClick={handleSchedule} disabled={busy}>
                  Planifier
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
