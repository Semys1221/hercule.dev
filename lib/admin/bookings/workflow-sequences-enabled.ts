import type { Niche } from "@/lib/admin/navigation";

export const WORKFLOW_SEQUENCES_DISABLED_TOOLTIP =
  "Rédigez la séquence de confirmation (onglet Séquences) avant d'activer les actions pipeline.";

export function workflowSequencesEnabled(niche: Niche): boolean {
  if (niche === "agence") {
    return true;
  }
  if (niche === "entreprise") {
    return true;
  }
  return false;
}
