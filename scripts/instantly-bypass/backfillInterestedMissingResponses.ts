/**
 * DB-first backfill for Interested leads missing E1 or reply-agent responses.
 * Only processes pipeline step_0 (missing E1) and inbound rows without outbound.
 *
 * Usage:
 *   pnpm backfill-interested-missing-responses -- --dry-run
 *   pnpm backfill-interested-missing-responses -- --campaign-id <uuid> --limit 50
 *   pnpm backfill-interested-missing-responses -- --contacts lgiboin@myfineo.fr
 */

import { handleLeadInterested } from "@/lib/instantly-bypass/handler";
import { findLeadByEmailInCampaign, getInstantlyApiKey } from "@/lib/instantly-bypass/client";
import { sweepMissedRepliesForLead, sweepMissedReplyInboxes } from "@/lib/ai-reply-agent/missed-reply-sweep";
import { sweepInterestedLeads } from "@/lib/ai-reply-agent/interested-sweep";
import { listBypassConfigs } from "@/lib/instantly-bypass/templates";
import { INTERESTED_STATUS } from "@/lib/ai-reply-agent/reply-gate";

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const campaignId = argv.includes("--campaign-id")
    ? argv[argv.indexOf("--campaign-id") + 1]?.trim()
    : undefined;
  const limitRaw = argv.includes("--limit")
    ? Number(argv[argv.indexOf("--limit") + 1])
    : 50;
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
    campaignId,
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50,
    sinceDays: Number.isFinite(sinceDaysRaw) && sinceDaysRaw > 0 ? sinceDaysRaw : 30,
    contacts: new Set(contacts),
  };
}

async function backfillContacts(params: {
  campaignId: string;
  contacts: Set<string>;
  dryRun: boolean;
}) {
  const apiKey = getInstantlyApiKey();
  for (const leadEmail of params.contacts) {
    const lead = await findLeadByEmailInCampaign(apiKey, params.campaignId, leadEmail);
    if (lead?.lt_interest_status !== INTERESTED_STATUS) {
      console.log(`skip ${leadEmail}: not Interested (status=${lead?.lt_interest_status ?? "missing"})`);
      continue;
    }
    if (params.dryRun) {
      console.log(`[dry-run] would missed-reply sweep + E1+reply ${leadEmail}`);
      continue;
    }
    const missed = await sweepMissedRepliesForLead({
      campaignId: params.campaignId,
      leadEmail,
    });
    console.log(`Missed-reply sweep ${leadEmail}:`, missed);
    const result = await handleLeadInterested({
      timestamp: new Date().toISOString(),
      event_type: "lead_interested",
      campaign_id: params.campaignId,
      lead_email: leadEmail,
    });
    console.log(`Backfill ${leadEmail}:`, result);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configs = await listBypassConfigs();
  const targets = args.campaignId
    ? configs.filter((config) => config.campaign_id === args.campaignId)
    : configs.filter((config) => Boolean(config.initialized_at));

  if (targets.length === 0) {
    throw new Error("No bypass campaigns matched");
  }

  for (const config of targets) {
    console.log(`\n=== ${config.campaign_name ?? config.campaign_id} ===`);

    if (args.contacts.size > 0) {
      await backfillContacts({
        campaignId: config.campaign_id,
        contacts: args.contacts,
        dryRun: args.dryRun,
      });
      continue;
    }

    if (args.dryRun) {
      console.log(
        `[dry-run] would sweep up to ${args.limit} E1 + ${args.limit} replies (since ${args.sinceDays}d)`,
      );
      continue;
    }

    const missed = await sweepMissedReplyInboxes({
      campaignId: config.campaign_id,
      limit: args.limit,
    });
    console.log("Missed-reply sweep:", missed);
    const stats = await sweepInterestedLeads({
      campaignId: config.campaign_id,
      e1Limit: args.limit,
      replyLimit: args.limit,
      sinceDays: args.sinceDays,
    });
    console.log("Interested sweep:", stats);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
