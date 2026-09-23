import type { SupabaseClient } from "@supabase/supabase-js";

import { PAYMENT_ONBOARDING_EMAIL_TYPES } from "@/lib/(resend)/onboarding/constants";
import type { OnboardingStepStatus } from "@/lib/clients/engin-types";

type OnboardingJobRow = {
  id: string;
  email_type: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  error_message: string | null;
  resend_email_id: string | null;
};

function jobStatusRank(status: string): number {
  if (status === "sent") return 3;
  if (status === "pending") return 2;
  if (status === "failed") return 1;
  return 0;
}

export async function loadPaymentOnboardingSteps(
  supabase: SupabaseClient,
  clientId: string,
): Promise<OnboardingStepStatus[]> {
  const { data, error } = await supabase
    .from("booking_email_jobs")
    .select(
      "id, email_type, status, scheduled_for, sent_at, error_message, resend_email_id",
    )
    .eq("lead_id", clientId)
    .eq("lead_category", "client")
    .in("email_type", [...PAYMENT_ONBOARDING_EMAIL_TYPES])
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const jobs = (data ?? []) as OnboardingJobRow[];
  const byType = new Map<string, OnboardingJobRow>();
  for (const job of jobs) {
    const existing = byType.get(job.email_type);
    if (!existing || jobStatusRank(job.status) >= jobStatusRank(existing.status)) {
      byType.set(job.email_type, job);
    }
  }

  return PAYMENT_ONBOARDING_EMAIL_TYPES.map((emailType, index) => {
    const job = byType.get(emailType);
    if (!job) {
      return {
        emailType,
        stepIndex: index + 1,
        status: "missing" as const,
        scheduledFor: null,
        sentAt: null,
        errorMessage: null,
        jobId: null,
        resendEmailId: null,
      };
    }

    const status =
      job.status === "sent" ||
      job.status === "pending" ||
      job.status === "failed" ||
      job.status === "cancelled"
        ? job.status
        : "pending";

    return {
      emailType,
      stepIndex: index + 1,
      status,
      scheduledFor: job.scheduled_for,
      sentAt: job.sent_at,
      errorMessage: job.error_message,
      jobId: job.id,
      resendEmailId: job.resend_email_id,
    };
  });
}
