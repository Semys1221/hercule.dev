"use client";

import { useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppointmentRow, ClientCockpitData } from "@/lib/admin/clients/types";

type CockpitAppointmentsPanelProps = {
  data: ClientCockpitData;
  onUpdated: () => Promise<void>;
};

const STATUS_LABELS: Record<AppointmentRow["status"], string> = {
  scheduled: "Planifié",
  completed: "Effectué",
  no_show_entreprise: "No-show entreprise",
  no_show_agence: "No-show agence",
  cancelled: "Annulé",
};

const STATUS_VARIANTS: Record<
  AppointmentRow["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "default",
  completed: "secondary",
  no_show_entreprise: "destructive",
  no_show_agence: "destructive",
  cancelled: "outline",
};

function AppointmentCard({
  appointment,
  onUpdated,
}: {
  appointment: AppointmentRow;
  onUpdated: () => Promise<void>;
}) {
  const [pending, setPending] = useState<"complete" | "noshow" | null>(null);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );

  const canAct = appointment.status === "scheduled";

  async function callAction(action: "complete" | "no-show", body?: object) {
    setPending(action === "complete" ? "complete" : "noshow");
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Erreur");
      setMessage({ variant: "success", text: "Mis à jour." });
      await onUpdated();
    } catch (err) {
      setMessage({
        variant: "error",
        text: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">
            {appointment.scheduled_at
              ? new Date(appointment.scheduled_at).toLocaleString("fr-FR")
              : "Date inconnue"}
          </CardTitle>
          <Badge variant={STATUS_VARIANTS[appointment.status]}>
            {STATUS_LABELS[appointment.status]}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">{appointment.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <InternalStatusAlert variant={message.variant} message={message.text} /> : null}

        {appointment.survey_token_agence ? (
          <p className="text-xs text-muted-foreground">
            Token survey agence:{" "}
            <span className="font-mono">{appointment.survey_token_agence}</span>
          </p>
        ) : null}
        {appointment.survey_token_entreprise ? (
          <p className="text-xs text-muted-foreground">
            Token survey entreprise:{" "}
            <span className="font-mono">{appointment.survey_token_entreprise}</span>
          </p>
        ) : null}

        {canAct ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={pending !== null}
              onClick={() => void callAction("complete")}
            >
              {pending === "complete" ? "…" : "RDV effectué"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending !== null}
              onClick={() => void callAction("no-show", { reporter: "entreprise" })}
            >
              {pending === "noshow" ? "…" : "No-show entreprise"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CockpitAppointmentsPanel({
  data,
  onUpdated,
}: CockpitAppointmentsPanelProps) {
  if (data.appointments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun RDV livraison pour ce client.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {data.appointments.length} RDV livraison — compléter ou signaler un no-show.
      </p>
      {data.appointments.map((appt) => (
        <AppointmentCard key={appt.id} appointment={appt} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
