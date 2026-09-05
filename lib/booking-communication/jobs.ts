import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

import type {
  BookingEmailEngagementEvent,
  BookingEmailJob,
  BookingEmailType,
  SequenceTriggeredBy,
} from "./types";

const ENGAGEMENT_COLUMN: Record<
  BookingEmailEngagementEvent,
  "opened_at" | "clicked_at" | "delivered_at"
> = {
  opened: "opened_at",
  clicked: "clicked_at",
  delivered: "delivered_at",
};

export async function insertJob(params: {
  category: LeadCategory;
  leadId: string;
  emailType: BookingEmailType;
  scheduledFor: Date;
  triggeredBy: SequenceTriggeredBy;
  idempotencyKey: string;
  useHtml?: boolean | null;
}): Promise<BookingEmailJob | null> {
  const client = createLinkTrackingClient();
  const row: Record<string, unknown> = {
    lead_category: params.category,
    lead_id: params.leadId,
    email_type: params.emailType,
    scheduled_for: params.scheduledFor.toISOString(),
    status: "pending",
    idempotency_key: params.idempotencyKey,
    triggered_by: params.triggeredBy,
  };
  if (params.useHtml != null) {
    row.use_html = params.useHtml;
  }
  const { data, error } = await client
    .from("booking_email_jobs")
    .upsert(
      row,
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
  extras?: { messageId?: string | null; threadSubject?: string | null },
): Promise<void> {
  const client = createLinkTrackingClient();
  const patch: Record<string, string | null> = {
    status: "sent",
    resend_email_id: resendEmailId,
    sent_at: new Date().toISOString(),
  };
  if (extras?.messageId) {
    patch.resend_message_id = extras.messageId;
  }
  if (extras?.threadSubject) {
    patch.thread_subject = extras.threadSubject;
  }
  const { error } = await client
    .from("booking_email_jobs")
    .update(patch)
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to mark job sent: ${error.message}`);
  }
}

export async function markJobEngagement(
  resendEmailId: string,
  event: BookingEmailEngagementEvent,
  occurredAt: string,
): Promise<boolean> {
  const trimmedId = resendEmailId.trim();
  if (!trimmedId) return false;

  const column = ENGAGEMENT_COLUMN[event];
  const client = createLinkTrackingClient();
  const { data: job, error: fetchError } = await client
    .from("booking_email_jobs")
    .select(`id, ${column}`)
    .eq("resend_email_id", trimmedId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load job for engagement: ${fetchError.message}`);
  }
  if (!job) return false;

  const existing = (job as Record<string, string | null>)[column];
  const nextValue =
    existing && existing <= occurredAt ? existing : occurredAt;

  if (existing === nextValue) {
    return true;
  }

  const { error: updateError } = await client
    .from("booking_email_jobs")
    .update({ [column]: nextValue })
    .eq("id", job.id);

  if (updateError) {
    throw new Error(`Failed to mark job engagement: ${updateError.message}`);
  }

  return true;
}

export async function rescheduleJob(jobId: string, scheduledFor: Date): Promise<void> {
  const client = createLinkTrackingClient();
  const { error } = await client
    .from("booking_email_jobs")
    .update({ scheduled_for: scheduledFor.toISOString() })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to reschedule job: ${error.message}`);
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
  "role_seq_24",
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

const THREAD_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
];

export type EmailThreadContext = {
  threadSubject: string | null;
  messageIds: string[];
};

export async function hasRoleRecoverySequenceStarted(
  leadId: string,
): Promise<boolean> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("id")
    .eq("lead_id", leadId)
    .in("email_type", ["role_seq_48", "role_seq_24"])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check role recovery sequence: ${error.message}`);
  }

  return Boolean(data);
}

export async function getThreadContext(
  leadId: string,
  threadTypes: BookingEmailType[] = THREAD_TYPES,
): Promise<EmailThreadContext> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("email_type, resend_message_id, thread_subject")
    .eq("lead_id", leadId)
    .eq("status", "sent")
    .in("email_type", threadTypes);

  if (error) {
    throw new Error(`Failed to load thread context: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    email_type: BookingEmailType;
    resend_message_id: string | null;
    thread_subject: string | null;
  }>;

  const order = new Map(threadTypes.map((type, index) => [type, index]));
  rows.sort(
    (a, b) => (order.get(a.email_type) ?? 99) - (order.get(b.email_type) ?? 99),
  );

  const messageIds = rows
    .map((row) => row.resend_message_id?.trim())
    .filter((value): value is string => Boolean(value));

  const rootType = threadTypes.includes("immediate")
    ? "immediate"
    : threadTypes.includes("role_seq_48")
      ? "role_seq_48"
      : threadTypes[0];
  const root = rows.find((row) => row.email_type === rootType);
  const threadSubject = root?.thread_subject?.trim() || null;

  return { threadSubject, messageIds };
}
