/**
 * Provision link-tracking slugs + Instantly custom_variables for médecins généralistes.
 *
 * Usage:
 *   pnpm provision-medecins-generalistes-links
 *   pnpm provision-medecins-generalistes-links -- --list-only
 *   pnpm provision-medecins-generalistes-links -- --resync-all
 */
import { getJumVertical } from "@/lib/admin/niches/jum-verticals";
import { provisionLinksFromList } from "@/lib/link-tracking/provision-from-list";

const resyncAll = process.argv.includes("--resync-all");
const listOnly = process.argv.includes("--list-only");

async function main(): Promise<void> {
  const vertical = getJumVertical("medecin");
  const category = "jum" as const;
  const results: Record<string, unknown> = {
    vertical: vertical.key,
    segment: vertical.segment,
    listId: vertical.listId,
    campaignId: vertical.campaignId,
  };

  if (listOnly) {
    results.list = await provisionLinksFromList({
      listId: vertical.listId,
      campaignId: vertical.campaignId,
      category,
      resyncAll,
      jumSegment: vertical.segment,
    });
  } else {
    results.campaign = await provisionLinksFromList({
      campaignId: vertical.campaignId,
      category,
      fromCampaign: true,
      resyncAll,
      jumSegment: vertical.segment,
    });
    results.list = await provisionLinksFromList({
      listId: vertical.listId,
      campaignId: vertical.campaignId,
      category,
      resyncAll,
      jumSegment: vertical.segment,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
