export type CreditField = "rdv_used" | "rdv_total";

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
