import { createBypassClient } from "./supabase";

import type { BypassFlow, BypassTemplateKey } from "./types";

export type BypassJobStatus = "pending" | "sent" | "cancelled" | "failed";

export type BypassJob = {
  id: string;
  idempotency_key: string;
  campaign_id: string;
  lead_email: string;
  template_key: BypassTemplateKey;
  scheduled_for: string;
  status: BypassJobStatus;
  payload: Record<string, unknown>;
  sent_at: string | null;
  cancelled_at: string | null;
  error_message: string | null;
  created_at: string;
};

export async function hasPendingBypassJob(idempotencyKey: string): Promise<boolean> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_jobs")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check bypass job: ${error.message}`);
  }
  return Boolean(data);
}

export async function listDueBypassJobs(limit = 50): Promise<BypassJob[]> {
  const client = createBypassClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("instantly_bypass_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list due bypass jobs: ${error.message}`);
  }

  return (data ?? []) as BypassJob[];
}

export async function markBypassJobSent(jobId: string): Promise<void> {
  const client = createBypassClient();
  const { error } = await client
    .from("instantly_bypass_jobs")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to mark bypass job sent: ${error.message}`);
  }
}

export async function markBypassJobFailed(
  jobId: string,
  message: string,
): Promise<void> {
  const client = createBypassClient();
  const { error } = await client
    .from("instantly_bypass_jobs")
    .update({
      status: "failed",
      error_message: message.slice(0, 2000),
    })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to mark bypass job failed: ${error.message}`);
  }
}

export async function rescheduleBypassJob(
  jobId: string,
  scheduledFor: Date,
): Promise<void> {
  const client = createBypassClient();
  const { error } = await client
    .from("instantly_bypass_jobs")
    .update({
      scheduled_for: scheduledFor.toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to reschedule bypass job: ${error.message}`);
  }
}

export function flowFromJob(job: BypassJob): BypassFlow {
  return job.template_key as BypassFlow;
}

export function leadSnapshotFromJob(job: BypassJob): Record<string, unknown> | null {
  const payload = job.payload ?? {};
  const lead = payload.lead;
  if (lead && typeof lead === "object") {
    return lead as Record<string, unknown>;
  }
  return null;
}

export function leadIdFromJob(job: BypassJob): string | null {
  const payload = job.payload ?? {};
  const leadId = payload.lead_id;
  if (typeof leadId === "string" && leadId.trim()) {
    return leadId.trim();
  }
  const lead = leadSnapshotFromJob(job);
  const fromLead = lead?.id;
  if (typeof fromLead === "string" && fromLead.trim()) {
    return fromLead.trim();
  }
  return null;
}
