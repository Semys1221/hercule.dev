/**
 * Provision conference (CIF) link-tracking slugs + Instantly custom_variables
 * for the IAS / courtiers prévoyance B2B campaign.
 *
 * Campaign: IAS
 * https://app.instantly.ai/app/campaign/fcfbc849-508d-493a-b8a1-fb14db2f4909/analytics
 *
 * Uses category "cif" → reservation_cif_link → reservation-conference.html
 *
 * Usage:
 *   pnpm provision-ias-conference-links
 *   pnpm provision-ias-conference-links -- --resync-all
 *   pnpm provision-ias-conference-links -- --list-only
 */
import { provisionLinksFromList } from "@/lib/legacy/link-tracking/provision-from-list";

const IAS_CAMPAIGN_ID = "fcfbc849-508d-493a-b8a1-fb14db2f4909";
/** Courtiers prévoyance B2B scraper list */
const IAS_LIST_ID = "016dffeb-b915-4f68-a496-c37b3108b4f3";

const resyncAll = process.argv.includes("--resync-all");
const listOnly = process.argv.includes("--list-only");

async function main(): Promise<void> {
  const campaignId = IAS_CAMPAIGN_ID;
  const category = "cif" as const;
  const results: Record<string, unknown> = {};

  if (listOnly) {
    results.list = await provisionLinksFromList({
      listId: IAS_LIST_ID,
      campaignId,
      category,
      resyncAll,
    });
  } else {
    results.campaign = await provisionLinksFromList({
      campaignId,
      category,
      fromCampaign: true,
      resyncAll,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
