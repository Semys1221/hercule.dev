export type WorkflowAction = "no_show" | "not_paid" | "lost";

export function formatWorkflowFeedback(
  status: WorkflowAction,
  sequence?: {
    started?: boolean;
    reason?: string;
    dispatched?: boolean;
  },
): string {
  const label =
    status === "no_show" ? "No Show" : status === "not_paid" ? "Non Payé" : "Perdu";
  if (!sequence?.started) {
    const reason = sequence?.reason ?? "erreur inconnue";
    return `Séquence ${label} non démarrée : ${reason}`;
  }
  if (sequence.reason === "jobs_already_scheduled") {
    return `Séquence ${label} relancée (emails déjà planifiés)`;
  }
  return `Séquence ${label} démarrée`;
}
