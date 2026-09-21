"use client";

import { useState } from "react";

import { startSequenceRecipient } from "@/lib/legacy/admin/management/recipients/actions/start";
import { sequencesForPhase } from "@/lib/legacy/admin/management/recipients/phase-map";
import { MANAGEMENT_PHASE_LABELS } from "@/lib/legacy/admin/management/recipients/status-labels";
import type { ManagementPhase } from "@/lib/legacy/admin/management/recipients/types";
import type { Niche } from "@/lib/legacy/admin/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type ManagementEnrollDialogProps = {
  niche: Niche;
  phase: ManagementPhase;
  onEnrolled?: () => void;
};

export function ManagementEnrollDialog({
  niche,
  phase,
  onEnrolled,
}: ManagementEnrollDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sequenceSlug, setSequenceSlug] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sequences = sequencesForPhase(niche, phase);

  async function handleSubmit() {
    if (!email.trim() || !sequenceSlug) {
      toast({ variant: "destructive", title: "Email et séquence requis" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await startSequenceRecipient({
        leadEmail: email.trim(),
        niche,
        sequenceSlug,
        scheduledAt: scheduledAt || undefined,
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
      toast({ title: "Séquence démarrée" });
      setOpen(false);
      setEmail("");
      setScheduledAt("");
      onEnrolled?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Démarrage impossible",
        description: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Démarrer une séquence</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Démarrer — {MANAGEMENT_PHASE_LABELS[phase]}</DialogTitle>
          <DialogDescription>
            Inscrit un destinataire et déclenche l&apos;orchestrateur associé.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="enroll-email">Email</Label>
            <Input
              id="enroll-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="prospect@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Séquence</Label>
            <Select value={sequenceSlug} onValueChange={setSequenceSlug}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une séquence" />
              </SelectTrigger>
              <SelectContent>
                {sequences.map((entry) => (
                  <SelectItem key={entry.slug} value={entry.slug}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enroll-scheduled">Planification (optionnel)</Label>
            <Input
              id="enroll-scheduled"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Démarrage…" : "Démarrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
