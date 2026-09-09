import type { Niche } from "@/lib/admin/navigation";
import { BOOKING_CONFIRMATION_DISABLED } from "@/lib/booking-communication/confirmation-disabled";

export const WORKFLOW_SEQUENCES_DISABLED_TOOLTIP = BOOKING_CONFIRMATION_DISABLED
  ? "Séquences de confirmation Resend désactivées — les RDV ne sont plus annulés automatiquement."
  : "Rédigez la séquence de confirmation (onglet Séquences) avant d'activer les actions pipeline.";

export function workflowSequencesEnabled(niche: Niche): boolean {
  if (BOOKING_CONFIRMATION_DISABLED) {
    return false;
  }
  if (niche === "agence") {
    return true;
  }
  if (niche === "entreprise") {
    return true;
  }
  return false;
}
