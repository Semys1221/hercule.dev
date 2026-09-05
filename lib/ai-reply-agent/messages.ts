import { createAiReplyAgentClient } from "./supabase";

import type { AiReplyMessageStatus } from "./types";

export type AiReplyAgentJob = {
  id: string;
  idempotency_key: string;
  campaign_id: string;
  lead_email: string;
  message_id: string | null;
  scheduled_for: string;
  status: string;
  payload: Record<string, unknown>;
};

export async function insertInboundMessage(params: {
  campaignId: string;
  leadEmail: string;
  eventType: string;
  instantlyEmailId: string | null;
  subject: string | null;
  bodyText: string;
  emailAccount: string | null;
  uniboxUrl: string | null;
  aiStatus: AiReplyMessageStatus;
  aiReason?: string | null;
  replyToUuid?: string | null;
}): Promise<{ id: string; duplicate: boolean }> {
  const client = createAiReplyAgentClient();
  const row = {
    campaign_id: params.campaignId,
    lead_email: params.leadEmail.toLowerCase(),
    direction: "inbound",
    event_type: params.eventType,
    instantly_email_id: params.instantlyEmailId,
    subject: params.subject,
    body_text: params.bodyText,
    email_account: params.emailAccount,
    unibox_url: params.uniboxUrl,
    ai_status: params.aiStatus,
    ai_reason: params.aiReason ?? null,
    reply_to_uuid: params.replyToUuid ?? params.instantlyEmailId,
  };

  if (params.instantlyEmailId) {
    const { data: existing } = await client
      .from("ai_reply_agent_messages")
      .select("id")
      .eq("campaign_id", params.campaignId)
      .eq("lead_email", params.leadEmail.toLowerCase())
      .eq("instantly_email_id", params.instantlyEmailId)
      .maybeSingle();
    if (existing?.id) {
      return { id: existing.id as string, duplicate: true };
    }
  }

  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to insert inbound message: ${error.message}`);
  }
  return { id: data.id as string, duplicate: false };
}

export async function insertOutboundMessage(params: {
  campaignId: string;
  leadEmail: string;
  bodyText: string;
  subject: string | null;
  emailAccount: string | null;
  aiStatus: AiReplyMessageStatus;
  aiReason?: string | null;
  groqModel?: string | null;
  replyToUuid?: string | null;
}): Promise<string> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .insert({
      campaign_id: params.campaignId,
      lead_email: params.leadEmail.toLowerCase(),
      direction: "outbound",
      subject: params.subject,
      body_text: params.bodyText,
      email_account: params.emailAccount,
      ai_status: params.aiStatus,
      ai_reason: params.aiReason ?? null,
      groq_model: params.groqModel ?? null,
      reply_to_uuid: params.replyToUuid ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to insert outbound message: ${error.message}`);
  }
  return data.id as string;
}

export async function updateInboundStatus(
  messageId: string,
  aiStatus: AiReplyMessageStatus,
  aiReason?: string | null,
  groqModel?: string | null,
  groqCostUsdTicks?: number | null,
): Promise<void> {
  const client = createAiReplyAgentClient();
  const { error } = await client
    .from("ai_reply_agent_messages")
    .update({
      ai_status: aiStatus,
      ai_reason: aiReason ?? null,
      groq_model: groqModel ?? null,
      groq_cost_usd_ticks: groqCostUsdTicks ?? null,
    })
    .eq("id", messageId);
  if (error) {
    throw new Error(`Failed to update message status: ${error.message}`);
  }
}

export async function queueManualReplyJob(params: {
  campaignId: string;
  leadEmail: string;
  messageId: string;
  scheduledFor: Date;
  payload: Record<string, unknown>;
}): Promise<void> {
  const client = createAiReplyAgentClient();
  const idempotencyKey = `manual:${params.messageId}:${params.scheduledFor.toISOString()}`;
  const { error } = await client.from("ai_reply_agent_jobs").insert({
    idempotency_key: idempotencyKey,
    campaign_id: params.campaignId,
    lead_email: params.leadEmail.toLowerCase(),
    message_id: params.messageId,
    scheduled_for: params.scheduledFor.toISOString(),
    status: "pending",
    payload: params.payload,
  });
  if (error) {
    throw new Error(`Failed to queue manual reply job: ${error.message}`);
  }
}

export async function listDueAiReplyJobs(limit = 50): Promise<AiReplyAgentJob[]> {
  const client = createAiReplyAgentClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("ai_reply_agent_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list due jobs: ${error.message}`);
  }
  return (data ?? []) as AiReplyAgentJob[];
}

export async function markAiReplyJobSent(jobId: string): Promise<void> {
  const client = createAiReplyAgentClient();
  const { error } = await client
    .from("ai_reply_agent_jobs")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function markAiReplyJobFailed(
  jobId: string,
  errorMessage: string,
): Promise<void> {
  const client = createAiReplyAgentClient();
  const { error } = await client
    .from("ai_reply_agent_jobs")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function rescheduleAiReplyJob(
  jobId: string,
  scheduledFor: Date,
): Promise<void> {
  const client = createAiReplyAgentClient();
  const { error } = await client
    .from("ai_reply_agent_jobs")
    .update({ scheduled_for: scheduledFor.toISOString() })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}
