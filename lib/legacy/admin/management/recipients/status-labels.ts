import type { ManagementPhase, RecipientStatus } from "./types";

export const RECIPIENT_STATUS_LABELS: Record<RecipientStatus, string> = {
  scheduled: "Planifié",
  active: "Actif",
  paused: "En pause",
  completed: "Terminé",
  stopped: "Arrêté",
  failed: "Échec",
};

export const MANAGEMENT_PHASE_LABELS: Record<ManagementPhase, string> = {
  outreach: "Outreach",
  booking: "Booking",
  client: "Client",
};

export function statusBadgeVariant(
  status: RecipientStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "scheduled":
      return "secondary";
    case "paused":
      return "outline";
    case "stopped":
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}
