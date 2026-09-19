import { reprocessInboundForLead } from "./reprocess-inbound";
import { createAiReplyAgentClient } from "./supabase";
import { ensureInterestedE1IfMissing } from "@/lib/instantly-bypass/ensure-interested-e1";
import { findLeadByEmailInCampaign, getInstantlyApiKey } from "@/lib/instantly-bypass/client";
import { listPipelineLeadsByStep } from "@/lib/instantly-bypass/pipeline";
import { INTERESTED_STATUS } from "./reply-gate";

import type { AiReplyMessageStatus } from "./types";

const REPROCESSABLE_STATUSES: AiReplyMessageStatus[] = [
  "pending",
  "skipped_not_interested",
  "skipped_recovery",
  "skipped_unsafe",
  "skipped_collision",
  "skipped_waiting_e1",
  "failed",
];

const SKIP_REASONS = new Set([
  "Lead marked No show in Instantly",
  "Lead marked Not interested in Instantly",
  "Opt-out détecté",
]);

export type InterestedSweepResult = {
  e1Attempted: number;
  e1Sent: number;
  replyAttempted: number;
  replyAutoReplied: number;
  skipped: number;
  errors: number;
};

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function listReplyCandidates(
  campaignId: string,
  sinceDays: number,
  limit: number,
): Promise<Array<{ leadEmail: string }>> {
  const client = createAiReplyAgentClient();
  const since = daysAgoIso(sinceDays);

  const { data: inbound, error } = await client
    .from("ai_reply_agent_messages")
    .select("lead_email, ai_status, ai_reason, created_at")
    .eq("campaign_id", campaignId)
    .eq("direction", "inbound")
    .in("ai_status", REPROCESSABLE_STATUSES)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    throw new Error(`Failed to list inbound candidates: ${error.message}`);
  }

  const { data: outbound, error: outboundError } = await client
    .from("ai_reply_agent_messages")
    .select("lead_email, created_at")
    .eq("campaign_id", campaignId)
    .eq("direction", "outbound")
    .gte("created_at", since);

  if (outboundError) {
    throw new Error(`Failed to list outbound messages: ${outboundError.message}`);
  }

  const outboundByLead = new Map<string, string[]>();
  for (const row of outbound ?? []) {
    const email = String(row.lead_email ?? "").toLowerCase();
    if (!email) continue;
    const list = outboundByLead.get(email) ?? [];
    list.push(String(row.created_at ?? ""));
    outboundByLead.set(email, list);
  }

  const seen = new Set<string>();
  const candidates: Array<{ leadEmail: string }> = [];

  for (const row of inbound ?? []) {
    const leadEmail = String(row.lead_email ?? "").trim().toLowerCase();
    if (!leadEmail || seen.has(leadEmail)) continue;
    if (SKIP_REASONS.has(String(row.ai_reason ?? ""))) continue;

    const inboundAt = String(row.created_at ?? "");
    const outs = outboundByLead.get(leadEmail) ?? [];
    const hasOutboundSince = outs.some((createdAt) => createdAt >= inboundAt);
    if (hasOutboundSince) continue;

    seen.add(leadEmail);
    candidates.push({ leadEmail });
    if (candidates.length >= limit) break;
  }

  return candidates;
}

export async function sweepInterestedLeads(params: {
  campaignId: string;
  e1Limit?: number;
  replyLimit?: number;
  sinceDays?: number;
}): Promise<InterestedSweepResult> {
  const e1Limit = params.e1Limit ?? 25;
  const replyLimit = params.replyLimit ?? 25;
  const sinceDays = params.sinceDays ?? 30;
  const apiKey = getInstantlyApiKey();

  const result: InterestedSweepResult = {
    e1Attempted: 0,
    e1Sent: 0,
    replyAttempted: 0,
    replyAutoReplied: 0,
    skipped: 0,
    errors: 0,
  };

  const step0Leads = await listPipelineLeadsByStep(params.campaignId, "step_0", e1Limit);
  for (const row of step0Leads) {
    const leadEmail = row.lead_email.trim().toLowerCase();
    const lead = await findLeadByEmailInCampaign(apiKey, params.campaignId, leadEmail);
    if (lead?.lt_interest_status !== INTERESTED_STATUS) {
      result.skipped += 1;
      continue;
    }

    result.e1Attempted += 1;
    const e1 = await ensureInterestedE1IfMissing({
      campaignId: params.campaignId,
      leadEmail,
    }).catch((err: unknown) => {
      result.errors += 1;
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    });

    if (e1.ok && !("skipped" in e1 && e1.skipped)) {
      result.e1Sent += 1;
    }
  }

  const replyCandidates = await listReplyCandidates(
    params.campaignId,
    sinceDays,
    replyLimit,
  );

  for (const { leadEmail } of replyCandidates) {
    const lead = await findLeadByEmailInCampaign(apiKey, params.campaignId, leadEmail);
    if (lead?.lt_interest_status !== INTERESTED_STATUS) {
      result.skipped += 1;
      continue;
    }

    result.replyAttempted += 1;
    const reply = await reprocessInboundForLead({
      campaignId: params.campaignId,
      leadEmail,
    }).catch((err: unknown) => {
      result.errors += 1;
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    });

    if (reply.ok && reply.aiStatus === "auto_replied") {
      result.replyAutoReplied += 1;
    } else if (reply.ok) {
      result.skipped += 1;
    } else {
      result.errors += 1;
    }
  }

  return result;
}
