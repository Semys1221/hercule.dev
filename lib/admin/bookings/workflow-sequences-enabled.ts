import type { Niche } from "@/lib/admin/navigation";

export const WORKFLOW_SEQUENCES_DISABLED_TOOLTIP =
  "Séquences non configurées (Phase 4)";

export function workflowSequencesEnabled(niche: Niche): boolean {
  return niche === "agence";
}
