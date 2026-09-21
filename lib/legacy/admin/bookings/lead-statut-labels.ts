import type { LeadStatut } from "@/lib/legacy/link-tracking/types";

export const LEAD_STATUT_LABELS: Record<LeadStatut, string> = {
  NOTBOOKED: "Non booké",
  CLICKED: "Cliqué",
  BOOKED: "Booké",
  MEETING_BOOKED: "RDV planifié",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  ONBOARDED: "Onboardé",
};

export function leadStatutLabel(statut: string | null | undefined): string {
  if (!statut) {
    return "—";
  }
  return LEAD_STATUT_LABELS[statut as LeadStatut] ?? statut;
}

export function leadStatutBadgeVariant(
  statut: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  if (!statut) {
    return "outline";
  }
  if (statut === "MEETING_BOOKED" || statut === "CONFIRMED" || statut === "BOOKED") {
    return "default";
  }
  if (statut === "CANCELLED") {
    return "destructive";
  }
  if (statut === "ONBOARDED") {
    return "secondary";
  }
  return "outline";
}
