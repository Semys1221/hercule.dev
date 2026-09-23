import { NextResponse } from "next/server";

import { PAYMENT_ONBOARDING_EMAIL_TYPES } from "@/lib/(resend)/onboarding/constants";
import { readClientOnboardingAnswers } from "@/lib/clients/onboarding-answers";
import type { OnboardingStepStatus } from "@/lib/clients/engin-types";
import { createClientsClient, findClientById } from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ id: string }>;
};

type OnboardingJobRow = {
  id: string;
  email_type: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  error_message: string | null;
  resend_email_id: string | null;
};

export type { OnboardingStepStatus };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const supabase = createClientsClient();
    const client = await findClientById(supabase, clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

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
      if (!existing) {
        byType.set(job.email_type, job);
        continue;
      }
      // Prefer sent > pending > failed/cancelled for display
      const rank = (status: string) =>
        status === "sent" ? 3 : status === "pending" ? 2 : status === "failed" ? 1 : 0;
      if (rank(job.status) >= rank(existing.status)) {
        byType.set(job.email_type, job);
      }
    }

    const steps: OnboardingStepStatus[] = PAYMENT_ONBOARDING_EMAIL_TYPES.map(
      (emailType, index) => {
        const job = byType.get(emailType);
        if (!job) {
          return {
            emailType,
            stepIndex: index + 1,
            status: "missing",
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
      },
    );

    return NextResponse.json({
      client: {
        id: client.id,
        email: client.email,
        firstName: client.first_name,
        slug: client.slug,
      },
      answers: readClientOnboardingAnswers(client),
      steps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load onboarding";
    console.error("[api/admin/engin/clients/id/onboarding]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
