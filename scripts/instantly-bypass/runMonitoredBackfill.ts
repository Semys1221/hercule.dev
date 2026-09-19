/**
 * Economical monitored backfill: only explicit targets, logs Grok usage.
 * Usage:
 *   tsx --env-file=.env scripts/instantly-bypass/runMonitoredBackfill.ts --phase aurelia
 *   tsx --env-file=.env scripts/instantly-bypass/runMonitoredBackfill.ts --phase failed --limit 5
 *   tsx --env-file=.env scripts/instantly-bypass/runMonitoredBackfill.ts --phase e1 --limit 10
 */

import { reprocessInboundForLead } from "@/lib/ai-reply-agent/reprocess-inbound";
import { sweepInterestedLeads } from "@/lib/ai-reply-agent/interested-sweep";
import { INTERESTED_STATUS } from "@/lib/ai-reply-agent/reply-gate";
import { createAiReplyAgentClient } from "@/lib/ai-reply-agent/supabase";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
} from "@/lib/instantly-bypass/client";

const CIF = "e3bdb573-fe9f-437d-bd96-4ceb52869dd4";
const COMPTABLE = "e4c58718-ca00-4e27-b714-68e522fe4db6";

function parseArgs(argv: string[]) {
  const phase = argv.includes("--phase")
    ? argv[argv.indexOf("--phase") + 1]?.trim()
    : "failed";
  const limitRaw = argv.includes("--limit")
    ? Number(argv[argv.indexOf("--limit") + 1])
    : 5;
  return {
    phase,
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 5,
  };
}

async function listWaitingE1Interested(limit: number): Promise<
  Array<{ campaignId: string; leadEmail: string }>
> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const client = createAiReplyAgentClient();
  const apiKey = getInstantlyApiKey();
  const campaigns = [CIF, COMPTABLE];

  const { data: inbound, error } = await client
    .from("ai_reply_agent_messages")
    .select("campaign_id, lead_email, created_at")
    .eq("direction", "inbound")
    .eq("ai_status", "skipped_waiting_e1")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const { data: outbound } = await client
    .from("ai_reply_agent_messages")
    .select("campaign_id, lead_email, created_at")
    .eq("direction", "outbound")
    .gte("created_at", since);

  const outs = new Map<string, string[]>();
  for (const row of outbound ?? []) {
    const k = `${row.campaign_id}:${String(row.lead_email).toLowerCase()}`;
    (outs.get(k) ?? outs.set(k, []).get(k)!).push(String(row.created_at));
  }

  const seen = new Set<string>();
  const targets: Array<{ campaignId: string; leadEmail: string }> = [];

  for (const row of inbound ?? []) {
    const campaignId = String(row.campaign_id ?? "");
    if (!campaigns.includes(campaignId)) continue;
    const leadEmail = String(row.lead_email ?? "").trim().toLowerCase();
    if (!leadEmail || seen.has(`${campaignId}:${leadEmail}`)) continue;
    const k = `${campaignId}:${leadEmail}`;
    if ((outs.get(k) ?? []).some((t) => t >= String(row.created_at))) continue;

    const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
    if (lead?.lt_interest_status !== INTERESTED_STATUS) continue;

    seen.add(k);
    targets.push({ campaignId, leadEmail });
    if (targets.length >= limit) break;
  }

  return targets;
}

async function listFailedInterested(limit: number): Promise<
  Array<{ campaignId: string; leadEmail: string }>
> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const client = createAiReplyAgentClient();
  const apiKey = getInstantlyApiKey();
  const campaigns = [CIF, COMPTABLE];

  const { data: inbound, error } = await client
    .from("ai_reply_agent_messages")
    .select("campaign_id, lead_email, created_at")
    .eq("direction", "inbound")
    .eq("ai_status", "failed")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const seen = new Set<string>();
  const targets: Array<{ campaignId: string; leadEmail: string }> = [];

  for (const row of inbound ?? []) {
    const campaignId = String(row.campaign_id ?? "");
    if (!campaigns.includes(campaignId)) continue;
    const leadEmail = String(row.lead_email ?? "").trim().toLowerCase();
    if (!leadEmail || seen.has(`${campaignId}:${leadEmail}`)) continue;

    const { data: outbound } = await client
      .from("ai_reply_agent_messages")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("lead_email", leadEmail)
      .eq("direction", "outbound")
      .gte("created_at", String(row.created_at ?? ""))
      .limit(1);
    if ((outbound?.length ?? 0) > 0) continue;

    const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
    if (lead?.lt_interest_status !== INTERESTED_STATUS) continue;

    seen.add(`${campaignId}:${leadEmail}`);
    targets.push({ campaignId, leadEmail });
    if (targets.length >= limit) break;
  }

  return targets;
}

async function reprocessTargets(
  targets: Array<{ campaignId: string; leadEmail: string }>,
) {
  let grokCalls = 0;
  let autoReplied = 0;
  let skipped = 0;
  let errors = 0;

  for (const target of targets) {
    grokCalls += 1;
    const result = await reprocessInboundForLead(target).catch((err: unknown) => {
      errors += 1;
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    });

    if (result.ok && result.aiStatus === "auto_replied") {
      autoReplied += 1;
      console.log(`✓ auto_replied ${target.leadEmail}`);
    } else if (result.ok) {
      skipped += 1;
      console.log(`~ ${target.leadEmail}: ${result.skipped ?? result.aiStatus ?? "skipped"}`);
    } else {
      console.log(`✗ ${target.leadEmail}: ${result.error}`);
    }
  }

  console.log({ grokCalls, autoReplied, skipped, errors });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.phase === "aurelia") {
    console.log("Phase aurelia: 1 Grok call max");
    await reprocessTargets([
      { campaignId: CIF, leadEmail: "contact@aurelia-patrimoine.fr" },
    ]);
    return;
  }

  if (args.phase === "failed") {
    const targets = await listFailedInterested(args.limit);
    console.log(`Phase failed: ${targets.length} Interested target(s), max ${args.limit} Grok calls`);
    for (const t of targets) console.log(`- ${t.leadEmail}`);
    await reprocessTargets(targets);
    return;
  }

  if (args.phase === "e1") {
    console.log(`Phase e1: sweep E1 only (limit ${args.limit}, no reply Grok unless needed)`);
    for (const campaignId of [CIF, COMPTABLE]) {
      const stats = await sweepInterestedLeads({
        campaignId,
        e1Limit: args.limit,
        replyLimit: 0,
        sinceDays: 30,
      });
      console.log(campaignId, stats);
    }
    return;
  }

  if (args.phase === "waiting_e1") {
    const targets = await listWaitingE1Interested(args.limit);
    console.log(
      `Phase waiting_e1: ${targets.length} leads with pre-E1 inbound (superseded by E1 — skipped, max ${args.limit} Grok for post-E1 only)`,
    );
    for (const t of targets) console.log(`- ${t.leadEmail}`);
    await reprocessTargets(targets);
    return;
  }

  throw new Error(`Unknown phase: ${args.phase}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
