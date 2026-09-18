/**
 * Read-only audit: Interested leads still missing E1 or reply-agent outbound.
 * Usage: pnpm audit-interested-missing-responses
 */

import { inboundNeedsFollowUp } from "@/lib/ai-reply-agent/inbound-question";
import { INTERESTED_STATUS } from "@/lib/ai-reply-agent/reply-gate";
import { createAiReplyAgentClient } from "@/lib/ai-reply-agent/supabase";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
} from "@/lib/instantly-bypass/client";
import { listPipelineLeadsByStep } from "@/lib/instantly-bypass/pipeline";
import { listBypassConfigs } from "@/lib/instantly-bypass/templates";

const REPROCESSABLE = new Set([
  "pending",
  "skipped_not_interested",
  "skipped_recovery",
  "skipped_unsafe",
  "skipped_collision",
  "failed",
  "skipped_waiting_e1",
]);

async function main() {
  const sinceDays = 30;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const client = createAiReplyAgentClient();
  const configs = (await listBypassConfigs()).filter((c) => c.initialized_at);
  const apiKey = getInstantlyApiKey();

  const summary = {
    campaigns: configs.length,
    step0Interested: 0,
    inboundNoOutboundInterested: 0,
    pendingInterested: 0,
    collisionNeedFollowUp: 0,
    waitingE1: 0,
    samples: [] as string[],
  };

  for (const cfg of configs) {
    const campaignId = cfg.campaign_id;
    const step0 = await listPipelineLeadsByStep(campaignId, "step_0", 500);
    for (const row of step0) {
      const email = row.lead_email.trim().toLowerCase();
      const lead = await findLeadByEmailInCampaign(apiKey, campaignId, email);
      if (lead?.lt_interest_status === INTERESTED_STATUS) {
        summary.step0Interested += 1;
      }
    }

    const { data: inbound } = await client
      .from("ai_reply_agent_messages")
      .select("lead_email, ai_status, ai_reason, body_text, created_at")
      .eq("campaign_id", campaignId)
      .eq("direction", "inbound")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const { data: outbound } = await client
      .from("ai_reply_agent_messages")
      .select("lead_email, created_at")
      .eq("campaign_id", campaignId)
      .eq("direction", "outbound")
      .gte("created_at", since);

    const outboundByLead = new Map<string, string[]>();
    for (const row of outbound ?? []) {
      const email = String(row.lead_email ?? "").toLowerCase();
      if (!email) continue;
      const list = outboundByLead.get(email) ?? [];
      list.push(String(row.created_at ?? ""));
      outboundByLead.set(email, list);
    }

    const seen = new Set<string>();
    for (const row of inbound ?? []) {
      const email = String(row.lead_email ?? "").trim().toLowerCase();
      if (!email || seen.has(email)) continue;

      const status = String(row.ai_status ?? "");
      if (!REPROCESSABLE.has(status)) continue;

      const inboundAt = String(row.created_at ?? "");
      const outs = outboundByLead.get(email) ?? [];
      if (outs.some((createdAt) => createdAt >= inboundAt)) continue;

      const lead = await findLeadByEmailInCampaign(apiKey, campaignId, email);
      if (lead?.lt_interest_status !== INTERESTED_STATUS) continue;

      seen.add(email);
      summary.inboundNoOutboundInterested += 1;
      if (status === "pending") summary.pendingInterested += 1;
      if (status === "skipped_waiting_e1") summary.waitingE1 += 1;
      if (
        status === "skipped_collision" &&
        inboundNeedsFollowUp(String(row.body_text ?? ""))
      ) {
        summary.collisionNeedFollowUp += 1;
      }
      if (summary.samples.length < 10) {
        summary.samples.push(`${email} [${status}] (${cfg.campaign_name ?? campaignId})`);
      }
    }
  }

  const backfillComplete =
    summary.step0Interested === 0 &&
    summary.inboundNoOutboundInterested === 0;

  console.log(JSON.stringify({ backfillComplete, ...summary }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
