"use client";

import * as React from "react";

import type { ClientRow } from "@/lib/clients/types";
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
import { toast } from "@/hooks/use-toast";

type EnginCalendlyDialogProps = {
  client: ClientRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (client: ClientRow) => void;
};

export function EnginCalendlyDialog({
  client,
  open,
  onOpenChange,
  onUpdated,
}: EnginCalendlyDialogProps) {
  const [url, setUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUrl(client?.calendly_scheduling_url ?? "");
    }
  }, [open, client?.id, client?.calendly_scheduling_url]);

  async function handleSubmit() {
    if (!client) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/engin/clients/${encodeURIComponent(client.id)}/calendly`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendlySchedulingUrl: url.trim() }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Échec de la mise à jour",
        );
      }
      onUpdated(body.client as ClientRow);
      toast({ title: "URL Calendly enregistrée" });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible d’enregistrer l’URL",
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
          <DialogTitle>URL Calendly</DialogTitle>
          <DialogDescription>
            {client
              ? `${client.email} — lien scheduling embedé sur /reservation`
              : "Sélectionnez un client"}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="engin-calendly-url">
              Lien de réservation
            </FieldLabel>
            <Input
              id="engin-calendly-url"
              type="url"
              placeholder="https://calendly.com/…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={submitting}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            disabled={submitting || !client}
            onClick={() => void handleSubmit()}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
