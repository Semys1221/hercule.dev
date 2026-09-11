import type { LeadCategory } from "@/lib/link-tracking/types";

export const CLIENTS_ONBOARDING_GATE_TABLES: LeadCategory[] = [
  "agence",
  "comptable",
  "entreprise",
  "cif",
];

export function filterOnboardedRows<T extends { onboarding_completed_at: string | null }>(
  rows: T[],
  all: boolean,
): T[] {
  if (all) {
    return rows;
  }
  return rows.filter((row) => row.onboarding_completed_at != null);
}
