import type { RoundRobinEligibilityReason } from "@/lib/clients/round-robin";
import type { ClientRow } from "@/lib/clients/types";

export type CreditField = "rdv_used" | "rdv_total";

export type EnginClientRow = ClientRow & {
  rrSharePct: number;
  eligibility: RoundRobinEligibilityReason;
};

export type OnboardingStepStatus = {
  emailType: string;
  stepIndex: number;
  status: "missing" | "pending" | "sent" | "failed" | "cancelled";
  scheduledFor: string | null;
  sentAt: string | null;
  errorMessage: string | null;
  jobId: string | null;
  resendEmailId: string | null;
};
