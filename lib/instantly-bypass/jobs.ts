import { createBypassClient } from "./supabase";

import type { BypassEventStatus, BypassFlow } from "./types";

export function interestedIdempotencyKey(campaignId: string, leadEmail: string): string {
  return `interested_email1:${campaignId}:${leadEmail.trim().toLowerCase()}`;
}

export function flowIdempotencyKey(flow: BypassFlow, campaignId: string, leadEmail: string): string {
  return `${flow}:${campaignId}:${leadEmail.trim().toLowerCase()}`;
}

export function noShowEmail1Key(campaignId: string, leadEmail: string): string {
  return flowIdempotencyKey("no_show_email1", campaignId, leadEmail);
}

export function noShowEmail2Key(campaignId: string, leadEmail: string): string {
  return flowIdempotencyKey("no_show_email2", campaignId, leadEmail);
}

export async function hasBypassEvent(idempotencyKey: string): Promise<boolean> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_events")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "sent")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check bypass event: ${error.message}`);
  }
  return Boolean(data);
}

export async function recordBypassEvent(params: {
  idempotencyKey: string;
  flow: BypassFlow;
  campaignId: string;
  leadEmail: string;
  leadId?: string | null;
  webhookReceivedAt?: Date | null;
  dispatchedAt?: Date | null;
  latencyMs?: number | null;
  status: BypassEventStatus;
  errorMessage?: string | null;
  replyToUuid?: string | null;
}): Promise<void> {
  const client = createBypassClient();
  const { error } = await client.from("instantly_bypass_events").upsert(
    {
      idempotency_key: params.idempotencyKey,
      flow: params.flow,
      campaign_id: params.campaignId,
      lead_email: params.leadEmail.trim().toLowerCase(),
      lead_id: params.leadId ?? null,
      webhook_received_at: params.webhookReceivedAt?.toISOString() ?? null,
      dispatched_at: params.dispatchedAt?.toISOString() ?? null,
      latency_ms: params.latencyMs ?? null,
      status: params.status,
      error_message: params.errorMessage ?? null,
      reply_to_uuid: params.replyToUuid ?? null,
    },
    { onConflict: "idempotency_key" },
  );

  if (error) {
    throw new Error(`Failed to record bypass event: ${error.message}`);
  }
}

export async function getBypassEventSentAt(
  idempotencyKey: string,
): Promise<string | null> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_events")
    .select("dispatched_at")
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "sent")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch bypass event: ${error.message}`);
  }
  return (data?.dispatched_at as string | null) ?? null;
}

export type BypassAnalytics = {
  totalSent: number;
  avgLatencyMs: number | null;
  failedCount: number;
  recentErrors: Array<{
    lead_email: string;
    campaign_id: string;
    error_message: string | null;
    created_at: string;
  }>;
};

export async function fetchBypassAnalytics(): Promise<BypassAnalytics> {
  const client = createBypassClient();

  const { data: sentRows, error: sentError } = await client
    .from("instantly_bypass_events")
    .select("latency_ms")
    .eq("status", "sent");

  if (sentError) {
    throw new Error(`Failed to fetch analytics: ${sentError.message}`);
  }

  const latencies = (sentRows ?? [])
    .map((row) => row.latency_ms as number | null)
    .filter((v): v is number => typeof v === "number");

  const { count: failedCount, error: failedError } = await client
    .from("instantly_bypass_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  if (failedError) {
    throw new Error(`Failed to count failed events: ${failedError.message}`);
  }

  const { data: errors, error: errorsError } = await client
    .from("instantly_bypass_events")
    .select("lead_email, campaign_id, error_message, created_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(20);

  if (errorsError) {
    throw new Error(`Failed to fetch errors: ${errorsError.message}`);
  }

  return {
    totalSent: sentRows?.length ?? 0,
    avgLatencyMs:
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null,
    failedCount: failedCount ?? 0,
    recentErrors: (errors ?? []) as BypassAnalytics["recentErrors"],
  };
}
