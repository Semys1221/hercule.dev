/**
 * Provision link-tracking slugs + Instantly custom_variables for comptable leads.
 *
 * Usage:
 *   pnpm provision-comptable-links
 *   pnpm provision-comptable-links -- --from-campaign
 *   pnpm provision-comptable-links -- --resync-all
 */
import {
  LEGACY_COMPTABLE_LIST_ID,
  provisionLinksFromList,
} from "@/lib/link-tracking/provision-from-list";

const fromCampaign = process.argv.includes("--from-campaign");
const resyncAll = process.argv.includes("--resync-all");
const listOnly = process.argv.includes("--list-only");

async function main(): Promise<void> {
  const campaignId = "e4c58718-ca00-4e27-b714-68e522fe4db6";
  const category = "comptable" as const;

  const results: Record<string, unknown> = {};

  if (!listOnly) {
    results.campaign = await provisionLinksFromList({
      campaignId,
      category,
      fromCampaign: true,
      resyncAll,
    });
  }

  if (!fromCampaign) {
    const listId = process.env.LINK_PROVISIONING_LIST_ID?.trim();
    results.recoveryList = await provisionLinksFromList({
      ...(listId ? { listId } : {}),
      campaignId,
      category,
      resyncAll,
    });
    results.legacyList = await provisionLinksFromList({
      listId: LEGACY_COMPTABLE_LIST_ID,
      campaignId,
      category,
      resyncAll,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
