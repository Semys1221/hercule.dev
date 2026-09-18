import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { Niche } from "@/lib/admin/navigation";

import type {
  EmailSequenceRecipient,
  ListRecipientsParams,
  ListRecipientsResult,
  ManagementPhase,
  RecipientStatus,
  RecipientStatusCounts,
} from "./types";

const ALL_STATUSES: RecipientStatus[] = [
  "scheduled",
  "active",
  "paused",
  "completed",
  "stopped",
  "failed",
];

function emptyCounts(): RecipientStatusCounts {
  return {
    scheduled: 0,
    active: 0,
    paused: 0,
    completed: 0,
    stopped: 0,
    failed: 0,
  };
}

function mapRow(row: Record<string, unknown>): EmailSequenceRecipient {
  return {
    id: String(row.id),
    lead_email: String(row.lead_email),
    lead_id: row.lead_id ? String(row.lead_id) : null,
    lead_category: row.lead_category as Niche,
    phase: row.phase as ManagementPhase,
    sequence_slug: String(row.sequence_slug),
    provider: row.provider as EmailSequenceRecipient["provider"],
    status: row.status as RecipientStatus,
    campaign_id: row.campaign_id ? String(row.campaign_id) : null,
    current_step: row.current_step ? String(row.current_step) : null,
    scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
    started_at: row.started_at ? String(row.started_at) : null,
    paused_at: row.paused_at ? String(row.paused_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    stopped_reason: row.stopped_reason ? String(row.stopped_reason) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function countByStatus(
  niche: Niche,
  phase?: ManagementPhase,
): Promise<RecipientStatusCounts> {
  const client = createLinkTrackingClient();
  let query = client
    .from("email_sequence_recipients")
    .select("status")
    .eq("lead_category", niche);

  if (phase) {
    query = query.eq("phase", phase);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`countByStatus failed: ${error.message}`);
  }

  const counts = emptyCounts();
  for (const row of data ?? []) {
    const status = String(row.status) as RecipientStatus;
    if (ALL_STATUSES.includes(status)) {
      counts[status] += 1;
    }
  }
  return counts;
}

export async function listRecipients(
  params: ListRecipientsParams,
): Promise<ListRecipientsResult> {
  const client = createLinkTrackingClient();
  const limit = params.limit ?? 500;

  let query = client
    .from("email_sequence_recipients")
    .select("*")
    .eq("lead_category", params.niche)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (params.phase) {
    query = query.eq("phase", params.phase);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`listRecipients failed: ${error.message}`);
  }

  const counts = await countByStatus(params.niche, params.phase);

  return {
    recipients: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    counts,
  };
}

export async function getRecipient(id: string): Promise<EmailSequenceRecipient | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("email_sequence_recipients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getRecipient failed: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return mapRow(data as Record<string, unknown>);
}

export async function upsertRecipientRow(
  row: Omit<EmailSequenceRecipient, "id" | "created_at" | "updated_at"> & { id?: string },
): Promise<EmailSequenceRecipient> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  const payload = {
    ...row,
    updated_at: now,
  };

  if (row.id) {
    const { data, error } = await client
      .from("email_sequence_recipients")
      .update(payload)
      .eq("id", row.id)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`upsertRecipientRow update failed: ${error?.message ?? "no row"}`);
    }
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await client
    .from("email_sequence_recipients")
    .insert({ ...payload, created_at: now })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`upsertRecipientRow insert failed: ${error?.message ?? "no row"}`);
  }
  return mapRow(data as Record<string, unknown>);
}

export async function findActiveRecipient(params: {
  leadEmail: string;
  niche: Niche;
  sequenceSlug: string;
}): Promise<EmailSequenceRecipient | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("email_sequence_recipients")
    .select("*")
    .eq("lead_email", params.leadEmail.trim().toLowerCase())
    .eq("lead_category", params.niche)
    .eq("sequence_slug", params.sequenceSlug)
    .in("status", ["scheduled", "active", "paused"])
    .maybeSingle();

  if (error) {
    throw new Error(`findActiveRecipient failed: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return mapRow(data as Record<string, unknown>);
}

export async function updateRecipientStatus(
  id: string,
  patch: Partial<
    Pick<
      EmailSequenceRecipient,
      | "status"
      | "scheduled_at"
      | "started_at"
      | "paused_at"
      | "completed_at"
      | "stopped_reason"
      | "current_step"
      | "campaign_id"
      | "lead_id"
      | "metadata"
    >
  >,
): Promise<EmailSequenceRecipient> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("email_sequence_recipients")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`updateRecipientStatus failed: ${error?.message ?? "no row"}`);
  }
  return mapRow(data as Record<string, unknown>);
}
