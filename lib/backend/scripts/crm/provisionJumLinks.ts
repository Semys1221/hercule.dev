/**
 * Provision link-tracking slugs + Instantly custom_variables for JUM campaign leads.
 *
 * Usage:
 *   pnpm provision-jum-links -- --vertical=restaurant
 *   pnpm provision-jum-links -- --vertical=btp
 *   pnpm provision-jum-links -- --vertical=dentiste
 *   pnpm provision-jum-links -- --vertical=medecin
 *   pnpm provision-jum-links -- --all
 *   pnpm provision-jum-links -- --list-id=<uuid>   # auto-resolves vertical + campaign
 */
import { provisionLinksFromList } from "@/lib/legacy/link-tracking/provision-from-list";
import {
  JUM_VERTICALS,
  resolveJumVertical,
  type JumVertical,
} from "@/lib/legacy/admin/niches/jum-verticals";

const resyncAll = process.argv.includes("--resync-all");
const listOnly = process.argv.includes("--list-only");
const provisionAll = process.argv.includes("--all");
const verticalArg = process.argv.find((arg) => arg.startsWith("--vertical="));
const verticalKey = verticalArg?.split("=")[1]?.trim() || null;
const listIdArg = process.argv.find((arg) => arg.startsWith("--list-id="));
const listIdOverride = listIdArg?.split("=")[1]?.trim() || null;
const segmentArg = process.argv.find((arg) => arg.startsWith("--segment="));
const segmentOverride = segmentArg?.split("=")[1]?.trim() || null;

async function provisionVertical(vertical: JumVertical): Promise<Record<string, unknown>> {
  const segment = segmentOverride || vertical.segment;
  const listId = listIdOverride || vertical.listId;
  const campaignId = vertical.campaignId;
  const category = "jum" as const;

  const results: Record<string, unknown> = {
    vertical: vertical.key,
    segment,
    listId,
    campaignId,
  };

  if (listOnly) {
    results.list = await provisionLinksFromList({
      listId,
      campaignId,
      category,
      resyncAll,
      jumSegment: segment,
    });
    return results;
  }

  results.campaign = await provisionLinksFromList({
    campaignId,
    category,
    fromCampaign: true,
    resyncAll,
    jumSegment: segment,
  });
  results.list = await provisionLinksFromList({
    listId,
    campaignId,
    category,
    resyncAll,
    jumSegment: segment,
  });

  return results;
}

async function main(): Promise<void> {
  if (provisionAll) {
    const all: Record<string, unknown> = {};
    for (const vertical of JUM_VERTICALS) {
      all[vertical.key] = await provisionVertical(vertical);
    }
    console.log(JSON.stringify(all, null, 2));
    return;
  }

  const vertical = resolveJumVertical({
    vertical: verticalKey,
    listId: listIdOverride,
  });

  if (!vertical) {
    const keys = JUM_VERTICALS.map((row) => row.key).join(", ");
    throw new Error(
      `JUM vertical not resolved — pass --vertical=(${keys}), --list-id=<uuid>, or --all`,
    );
  }

  console.log(JSON.stringify(await provisionVertical(vertical), null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
