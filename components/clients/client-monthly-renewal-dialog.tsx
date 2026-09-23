"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  eliteOptionBody,
  MONTHLY_RENEWAL_CTA_CONTINUE,
  MONTHLY_RENEWAL_CTA_PAUSE,
  standardOptionBody,
  type RenewalChoice,
} from "@/lib/clients/monthly-renewal-announcement";
import type { ClientDashboardData } from "@/lib/clients/types";

type ClientMonthlyRenewalDialogProps = {
  slug: string;
  announcement: ClientDashboardData["monthlyRenewalAnnouncement"];
  onResolved: () => void;
};

export function ClientMonthlyRenewalDialog({
  slug,
  announcement,
  onResolved,
}: ClientMonthlyRenewalDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<RenewalChoice | null>(null);
  const didAutoOpen = useRef(false);

  useEffect(() => {
    if (!announcement?.show || didAutoOpen.current) return;
    didAutoOpen.current = true;
    setOpen(true);
  }, [announcement?.show]);

  async function submit(choice: RenewalChoice) {
    setSubmitting(choice);
    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(slug)}/monthly-renewal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Impossible d'enregistrer votre choix");
      }
      setOpen(false);
      toast({
        title: choice === "pause" ? "Abonnement en pause" : "Abonnement inchangé",
        description:
          choice === "pause"
            ? "Vous ne serez pas prélevé. Vos rendez-vous restants continuent d'être livrés."
            : "Vous conservez la file d'attente prioritaire.",
      });
      onResolved();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Choix non enregistré",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(null);
    }
  }

  if (!announcement?.show) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Votre mensualité dans 7 jours</DialogTitle>
          <DialogDescription>
            C&apos;est la seule fois où nous vous demandons comment poursuivre. Vous pouvez
            répondre plus tard tant que la fenêtre est ouverte.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground">Vitesse standard</p>
            <p className="text-sm text-muted-foreground">
              {standardOptionBody({
                rdvRemaining: announcement.rdvRemaining,
                volumeEndLabel: announcement.volumeEndLabel,
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={submitting !== null}
              onClick={() => void submit("pause")}
            >
              {submitting === "pause" ? "Enregistrement…" : MONTHLY_RENEWAL_CTA_PAUSE}
            </Button>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground">File d&apos;attente prioritaire</p>
            <p className="text-sm text-muted-foreground">{eliteOptionBody()}</p>
            <Button
              type="button"
              disabled={submitting !== null}
              onClick={() => void submit("continue")}
            >
              {submitting === "continue" ? "Enregistrement…" : MONTHLY_RENEWAL_CTA_CONTINUE}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
