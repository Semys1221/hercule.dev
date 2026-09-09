import type { LeadCategory } from "@/lib/link-tracking/types";

export const RETRACTION_STATUS_VALUES = [
  "pending",
  "waived",
  "expired",
  "n_a",
] as const;

export type RetractionStatus = (typeof RETRACTION_STATUS_VALUES)[number];

export type RetractionRow = {
  retraction_status?: RetractionStatus | string | null;
  retraction_ends_at?: string | null;
  retraction_waived_at?: string | null;
  onboarding_completed_at?: string | null;
};

export type DashboardRetraction = {
  status: RetractionStatus;
  endsAt: string | null;
  waivedAt: string | null;
  canWaive: boolean;
  activationAt: string | null;
  firstContratWorkingDays: number;
};

export type RetractionAudience = Extract<LeadCategory, "agence" | "comptable">;
