"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { ClientAppointmentPublic } from "@/lib/clients/appointments/types";

type ClientAppointmentsCardProps = {
  slug: string;
  appointments: ClientAppointmentPublic[];
  onRefresh?: () => void;
  borderless?: boolean;
};

const STATUS_LABEL: Record<ClientAppointmentPublic["status"], string> = {
  scheduled: "Planifié",
  no_show: "No-show",
  refused: "Refusé",
  rescheduled: "Replanifié",
  canceled: "Annulé",
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Date à confirmer";
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function ClientAppointmentsCard({
  slug,
  appointments,
  onRefresh,
  borderless = false,
}: ClientAppointmentsCardProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function runAction(
    appointmentId: string,
    action: "noshow" | "refuse" | "reschedule",
  ) {
    setPendingId(`${appointmentId}:${action}`);
    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(slug)}/appointments/${appointmentId}/${action}`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        nextStart?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Action impossible");
      }
      toast({
        title:
          action === "noshow"
            ? "No-show signalé"
            : action === "refuse"
              ? "Rendez-vous refusé"
              : "Rendez-vous replanifié",
        description:
          action === "reschedule" && body.nextStart
            ? `Nouveau créneau : ${formatWhen(body.nextStart)}`
            : "Votre tableau de bord a été mis à jour.",
      });
      onRefresh?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setPendingId(null);
    }
  }

  const header = (
    <div className="flex flex-col gap-1 pb-4">
      <h3 className="text-base font-semibold">Rendez-vous</h3>
      <p className="text-sm text-muted-foreground">
        Nouveaux rendez-vous, no-show, refus et replanification.
      </p>
    </div>
  );

  const list = (
    <>
      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun rendez-vous pour le moment.</p>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment.id}
            id={`rdv-${appointment.id}`}
            className={
              borderless
                ? "flex flex-col gap-3 border-b border-border/40 py-4 last:border-b-0"
                : "flex flex-col gap-3 rounded-lg border border-border p-4"
            }
          >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {appointment.inviteeName || appointment.inviteeEmail}
                </p>
                <Badge variant="outline">
                  {STATUS_LABEL[appointment.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatWhen(appointment.scheduledAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.inviteeEmail}
              </p>
              {Object.keys(appointment.questions).length > 0 ? (
                <dl className="flex flex-col gap-2 text-sm">
                  {Object.entries(appointment.questions).map(
                    ([question, answer]) => (
                      <div key={question}>
                        <dt className="text-muted-foreground">{question}</dt>
                        <dd>{answer || "—"}</dd>
                      </div>
                    ),
                  )}
                </dl>
              ) : null}
              {appointment.canAct ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingId !== null}
                    onClick={() => void runAction(appointment.id, "noshow")}
                  >
                    Signaler no-show
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingId !== null}
                    onClick={() => void runAction(appointment.id, "refuse")}
                  >
                    Refuser
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pendingId !== null}
                    onClick={() => void runAction(appointment.id, "reschedule")}
                  >
                    Replanifier
                  </Button>
                </div>
              ) : null}
            </div>
          ))
      )}
    </>
  );

  if (borderless) {
    return (
      <div className="flex flex-col">
        {header}
        {list}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Rendez-vous</CardTitle>
        <CardDescription>
          Nouveaux rendez-vous, no-show, refus et replanification.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{list}</CardContent>
    </Card>
  );
}
