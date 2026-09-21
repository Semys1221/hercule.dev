"use client";

import * as React from "react";

import type { ClientRow } from "@/lib/clients/types";
import type { CreditField } from "@/lib/clients/engin-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type EnginCreditsDialogProps = {
  client: ClientRow | null;
  field: CreditField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (client: ClientRow) => void;
};

export function EnginCreditsDialog({
  client,
  field,
  open,
  onOpenChange,
  onUpdated,
}: EnginCreditsDialogProps) {
  const [delta, setDelta] = React.useState("1");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDelta("1");
      setReason("");
    }
  }, [open, field, client?.id]);

  const fieldLabel =
    field === "rdv_used" ? "crédits utilisés (rdv_used)" : "quota RDV (rdv_total)";

  async function handleSubmit(sign: 1 | -1) {
    if (!client || !field) return;
    const abs = Math.abs(Number(delta));
    if (!Number.isFinite(abs) || abs === 0) {
      toast({
        variant: "destructive",
        title: "Delta invalide",
        description: "Indiquez un nombre entier non nul.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/engin/clients/${encodeURIComponent(client.id)}/credits`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field,
            delta: abs * sign,
            reason: reason.trim() || undefined,
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Échec de l'ajustement",
        );
      }

      onUpdated(body.client as ClientRow);
      toast({
        title: "Crédits mis à jour",
        description: `${body.nextUsed} / ${body.nextTotal} RDV`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible d'ajuster les crédits",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuster {fieldLabel}</DialogTitle>
          <DialogDescription>
            {client
              ? `${client.email} — solde actuel ${client.rdv_used} / ${client.rdv_total}`
              : "Sélectionnez un client"}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="engin-credits-delta">Montant</FieldLabel>
            <Input
              id="engin-credits-delta"
              type="number"
              min={1}
              step={1}
              value={delta}
              onChange={(event) => setDelta(event.target.value)}
              disabled={submitting}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="engin-credits-reason">
              Motif (optionnel)
            </FieldLabel>
            <Textarea
              id="engin-credits-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
              rows={3}
            />
          </Field>
        </FieldGroup>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={submitting || !client}
            onClick={() => void handleSubmit(-1)}
          >
            Baisser
          </Button>
          <Button
            type="button"
            disabled={submitting || !client}
            onClick={() => void handleSubmit(1)}
          >
            Augmenter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
