/**
 * Provision link-tracking slugs + Instantly custom_variables for CIF campaign leads.
 *
 * Campaign: Conseil Financier
 * https://app.instantly.ai/app/campaign/e3bdb573-fe9f-437d-bd96-4ceb52869dd4/analytics
 *
 * Usage:
 *   pnpm provision-cif-links
 *   pnpm provision-cif-links -- --resync-all
 *   pnpm provision-cif-links -- --list-only   (scraper source list, not the campaign)
 */
import { provisionLinksFromList } from "@/lib/link-tracking/provision-from-list";

const CIF_CAMPAIGN_ID = "e3bdb573-fe9f-437d-bd96-4ceb52869dd4";
const CIF_LIST_ID = "4a616678-06a0-44d2-a27c-f9248a4c34bf";

const resyncAll = process.argv.includes("--resync-all");
const listOnly = process.argv.includes("--list-only");

async function main(): Promise<void> {
  const campaignId = CIF_CAMPAIGN_ID;
  const category = "cif" as const;
  const results: Record<string, unknown> = {};

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8b6caf",
    },
    body: JSON.stringify({
      sessionId: "8b6caf",
      location: "scripts/crm/provisionCifLinks.ts:main",
      message: "CIF provision target",
      data: {
        campaignId,
        listOnly,
        resyncAll,
        listId: listOnly ? CIF_LIST_ID : null,
      },
      timestamp: Date.now(),
      hypothesisId: "campaign-mismatch",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion

  if (listOnly) {
    results.list = await provisionLinksFromList({
      listId: CIF_LIST_ID,
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
