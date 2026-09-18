/**
 * Economical backfill: only skipped_collision inbounds that still need a reply.
 * Targets CIF + comptable campaigns by default; pre-filters with inboundNeedsFollowUp
 * so Grok is not called on refusals / empty bodies.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/instantly-bypass/backfillCollisionFollowUps.ts
 *   npx tsx --env-file=.env scripts/instantly-bypass/backfillCollisionFollowUps.ts -- --dry-run
 *   npx tsx --env-file=.env scripts/instantly-bypass/backfillCollisionFollowUps.ts -- --contacts a@b.fr,c@d.fr
 */

import { inboundNeedsFollowUp } from "@/lib/ai-reply-agent/inbound-question";
import { reprocessInboundForLead } from "@/lib/ai-reply-agent/reprocess-inbound";
import { INTERESTED_STATUS } from "@/lib/ai-reply-agent/reply-gate";
import { createAiReplyAgentClient } from "@/lib/ai-reply-agent/supabase";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
} from "@/lib/instantly-bypass/client";

const DEFAULT_CAMPAIGNS = [
  {
    id: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
    name: "conseillers_gestion_patrimoine",
  },
  {
    id: "e4c58718-ca00-4e27-b714-68e522fe4db6",
    name: "Expertise Comptable",
  },
] as const;

type Candidate = {
  campaignId: string;
  campaignName: string;
  leadEmail: string;
  preview: string;
  createdAt: string;
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const sinceDaysRaw = argv.includes("--since-days")
    ? Number(argv[argv.indexOf("--since-days") + 1])
    : 30;
  const contacts = argv.includes("--contacts")
    ? argv[argv.indexOf("--contacts") + 1]
        ?.split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean) ?? []
    : [];
  return {
    dryRun,
    sinceDays: Number.isFinite(sinceDaysRaw) && sinceDaysRaw > 0 ? sinceDaysRaw : 30,
    contacts: new Set(contacts),
  };
}

async function listCollisionCandidates(params: {
  campaignId: string;
  campaignName: string;
  sinceDays: number;
  contacts: Set<string>;
}): Promise<Candidate[]> {
  const client = createAiReplyAgentClient();
  const since = new Date(Date.now() - params.sinceDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .select("lead_email, body_text, created_at")
    .eq("campaign_id", params.campaignId)
    .eq("direction", "inbound")
    .eq("ai_status", "skipped_collision")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list collision inbounds: ${error.message}`);
  }

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  for (const row of data ?? []) {
    const leadEmail = String(row.lead_email ?? "").trim().toLowerCase();
    if (!leadEmail || seen.has(leadEmail)) continue;
    if (params.contacts.size > 0 && !params.contacts.has(leadEmail)) continue;

    const bodyText = String(row.body_text ?? "");
    if (!inboundNeedsFollowUp(bodyText)) continue;

    const createdAt = String(row.created_at ?? "");
    const { data: outbound } = await client
      .from("ai_reply_agent_messages")
      .select("id")
      .eq("campaign_id", params.campaignId)
      .eq("lead_email", leadEmail)
      .eq("direction", "outbound")
      .gte("created_at", createdAt)
      .limit(1);

    if ((outbound?.length ?? 0) > 0) continue;

    seen.add(leadEmail);
    candidates.push({
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      leadEmail,
      preview: bodyText.replace(/\s+/g, " ").slice(0, 100),
      createdAt,
    });
  }

  return candidates;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = getInstantlyApiKey();
  const allCandidates: Candidate[] = [];

  for (const campaign of DEFAULT_CAMPAIGNS) {
    const rows = await listCollisionCandidates({
      campaignId: campaign.id,
      campaignName: campaign.name,
      sinceDays: args.sinceDays,
      contacts: args.contacts,
    });
    allCandidates.push(...rows);
  }

  console.log(
    `Found ${allCandidates.length} actionable skipped_collision lead(s) (Grok calls only if Interested):`,
  );
  for (const row of allCandidates) {
    console.log(`- [${row.campaignName}] ${row.leadEmail}: ${row.preview}`);
  }

  if (args.dryRun || allCandidates.length === 0) {
    return;
  }

  let attempted = 0;
  let autoReplied = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of allCandidates) {
    const lead = await findLeadByEmailInCampaign(
      apiKey,
      row.campaignId,
      row.leadEmail,
    );
    if (lead?.lt_interest_status !== INTERESTED_STATUS) {
      console.log(`skip ${row.leadEmail}: not Interested (status=${lead?.lt_interest_status ?? "missing"})`);
      skipped += 1;
      continue;
    }

    attempted += 1;
    const result = await reprocessInboundForLead({
      campaignId: row.campaignId,
      leadEmail: row.leadEmail,
    }).catch((err: unknown) => {
      errors += 1;
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    });

    if (result.ok && result.aiStatus === "auto_replied") {
      autoReplied += 1;
      console.log(`✓ auto_replied ${row.leadEmail}`);
    } else if (result.ok) {
      skipped += 1;
      console.log(`~ skipped ${row.leadEmail}: ${result.skipped ?? result.aiStatus ?? "unknown"}`);
    } else {
      console.log(`✗ failed ${row.leadEmail}: ${result.error}`);
    }
  }

  console.log({ attempted, autoReplied, skipped, errors, grokCalls: attempted });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
