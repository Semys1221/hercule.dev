"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { isClientCalendarConnected } from "@/lib/clients/dashboard-connections";
import type { CalendlySeatOnboardingRow } from "@/lib/(resend)/calendly-seat/client-store";
import type { ClientRow } from "@/lib/clients/types";

type EnginConfirmCalendlyCardProps = {
  client: ClientRow;
  calendlySeat: CalendlySeatOnboardingRow | null;
  onUpdated: (client: ClientRow) => void;
};

export function EnginConfirmCalendlyCard({
  client,
  calendlySeat,
  onUpdated,
}: EnginConfirmCalendlyCardProps) {
  const [url, setUrl] = React.useState(client.calendly_scheduling_url ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const confirmed = isClientCalendarConnected({
    profile: client.profile,
    calendlySeat: calendlySeat
      ? {
          status: calendlySeat.status,
          invitationStatus: calendlySeat.calendly_invitation_status,
        }
      : null,
  });

  React.useEffect(() => {
    setUrl(client.calendly_scheduling_url ?? "");
  }, [client.id, client.calendly_scheduling_url]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/engin/clients/${encodeURIComponent(client.id)}/calendly`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmCalendly: true,
            calendlySchedulingUrl: url.trim(),
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Échec de la confirmation");
      }
      const body = (await response.json()) as { client: ClientRow };
      onUpdated(body.client);
      toast({ title: "Calendly confirmé" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Confirmation impossible",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmer Calendly</CardTitle>
        <CardDescription>
          Configuration manuelle côté ops (invitation siège, lien scheduling). Aucune
          synchronisation automatique avec l’API Calendly.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {calendlySeat ? (
          <dl className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Siège onboarding</dt>
              <dd className="font-medium">{calendlySeat.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Invitation</dt>
              <dd>{calendlySeat.calendly_invitation_status ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune ligne <code className="text-xs">calendly_seat_onboarding</code> pour ce
            client.
          </p>
        )}

        {confirmed ? (
          <p className="text-sm text-foreground">
            Calendrier marqué comme connecté pour ce client.
          </p>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="engin-calendly-url">Lien Calendly (optionnel si déjà en base)</FieldLabel>
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

        <Button
          type="button"
          disabled={submitting}
          onClick={() => void handleConfirm()}
        >
          {submitting ? "Enregistrement…" : "Confirmer Calendly"}
        </Button>
      </CardContent>
    </Card>
  );
}
