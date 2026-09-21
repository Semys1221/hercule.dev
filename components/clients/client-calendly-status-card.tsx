"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClientCalendlySeat } from "@/lib/clients/types";

function statusLabel(seat: ClientCalendlySeat | null): string {
  if (!seat) {
    return "Invitation en préparation";
  }
  if (seat.invitationStatus === "accepted" || seat.status === "active") {
    return "Agenda connecté";
  }
  if (seat.invitationStatus === "pending" || seat.status === "invite_pending") {
    return "Invitation envoyée — en attente d'acceptation";
  }
  if (seat.status === "reminder_sent") {
    return "Rappel envoyé — vérifiez votre boîte mail";
  }
  return "Invitation Calendly en cours d'envoi";
}

type ClientCalendlyStatusCardProps = {
  calendlySeat: ClientCalendlySeat | null;
};

export function ClientCalendlyStatusCard({ calendlySeat }: ClientCalendlyStatusCardProps) {
  const label = statusLabel(calendlySeat);
  const connected =
    calendlySeat?.invitationStatus === "accepted" || calendlySeat?.status === "active";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Connexion Calendly</CardTitle>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Connecté" : "En attente"}
          </Badge>
        </div>
        <CardDescription>
          Connectez votre agenda pour recevoir vos rendez-vous qualifiés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
