import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

import type {
  BookingEmailJob,
  BookingEmailType,
  SequenceTriggeredBy,
} from "./types";

export async function insertJob(params: {
  category: LeadCategory;
  leadId: string;
  emailType: BookingEmailType;
  scheduledFor: Date;
  triggeredBy: SequenceTriggeredBy;
  idempotencyKey: string;
}): Promise<BookingEmailJob | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .upsert(
      {
        lead_category: params.category,
        lead_id: params.leadId,
        email_type: params.emailType,
        scheduled_for: params.scheduledFor.toISOString(),
        status: "pending",
        idempotency_key: params.idempotencyKey,
        triggered_by: params.triggeredBy,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    throw new Error(`Failed to insert booking job: ${error.message}`);
  }

  return (data as BookingEmailJob | null) ?? null;
}

export async function listDueJobs(limit = 50): Promise<BookingEmailJob[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list due booking jobs: ${error.message}`);
  }

  return (data ?? []) as BookingEmailJob[];
}

export async function markJobSent(
  jobId: string,
  resendEmailId: string,
): Promise<void> {
  const client = createLinkTrackingClient();
  const { error } = await client
    .from("booking_email_jobs")
    .update({
      status: "sent",
      resend_email_id: resendEmailId,
      sent_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to mark job sent: ${error.message}`);
  }
}

export async function markJobFailed(jobId: string, message: string): Promise<void> {
  const client = createLinkTrackingClient();
  const { error } = await client
    .from("booking_email_jobs")
    .update({
      status: "failed",
      error_message: message.slice(0, 2000),
    })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to mark job failed: ${error.message}`);
  }
}

const FOLLOW_UP_EMAIL_TYPES: BookingEmailType[] = [
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
];

export async function cancelPendingJobsForLead(
  leadId: string,
  emailTypes: BookingEmailType[],
): Promise<number> {
  if (emailTypes.length === 0) return 0;
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("booking_email_jobs")
    .update({
      status: "cancelled",
      cancelled_at: now,
    })
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .in("email_type", emailTypes)
    .select("id");

  if (error) {
    throw new Error(`Failed to cancel pending jobs: ${error.message}`);
  }

  return data?.length ?? 0;
}

export async function cancelFollowUpJobs(leadId: string): Promise<number> {
  return cancelPendingJobsForLead(leadId, FOLLOW_UP_EMAIL_TYPES);
}

export async function cancelJob(jobId: string): Promise<void> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  const { error } = await client
    .from("booking_email_jobs")
    .update({
      status: "cancelled",
      cancelled_at: now,
    })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to cancel job: ${error.message}`);
  }
}

export async function cancelH24Jobs(leadId: string): Promise<number> {
  return cancelPendingJobsForLead(leadId, ["h24_relance"]);
}

export async function hasSequenceStarted(leadId: string): Promise<boolean> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("id")
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check sequence: ${error.message}`);
  }

  return Boolean(data);
}
