"use client";

import { useState } from "react";

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type ClientNoShowDialogProps = {
  slug: string;
  onSuccess?: () => void;
};

export function ClientNoShowDialog({ slug, onSuccess }: ClientNoShowDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      toast({
        variant: "destructive",
        title: "Message trop court",
        description: "Décrivez le problème en au moins 10 caractères.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(slug)}/noshow`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Échec de l'envoi du signalement",
        );
      }

      const refunded = Boolean(body.refunded);
      toast({
        title: "Signalement envoyé",
        description: refunded
          ? "Un crédit a été remboursé. Notre équipe a été notifiée."
          : "Notre équipe a été notifiée. Vous recevrez une confirmation par email.",
      });
      setMessage("");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible d'envoyer le signalement",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Signaler un problème
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un problème de rendez-vous</DialogTitle>
          <DialogDescription>
            Décrivez le no-show ou le problème rencontré. Un crédit rendez-vous
            sera remboursé automatiquement si un crédit a déjà été consommé.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="client-noshow-message">
              Description du problème
            </FieldLabel>
            <Textarea
              id="client-noshow-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={submitting}
              rows={5}
              placeholder="Ex. : l'entreprise ne s'est pas présentée au RDV du…"
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
          >
            {submitting ? "Envoi…" : "Envoyer et rembourser 1 crédit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
