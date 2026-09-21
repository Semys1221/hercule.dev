import type { RetractionStatus } from "./types";

export const RETRACTION_STATUS_LABELS: Record<RetractionStatus, string> = {
  pending: "Conservée",
  waived: "Renoncée",
  expired: "Expirée",
  n_a: "—",
};

export function retractionStatusLabel(status: string | null | undefined): string {
  if (
    status === "pending" ||
    status === "waived" ||
    status === "expired" ||
    status === "n_a"
  ) {
    return RETRACTION_STATUS_LABELS[status];
  }
  return "—";
}
