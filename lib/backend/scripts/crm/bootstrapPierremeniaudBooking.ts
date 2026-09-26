/**
 * Bootstrap Pierre Meniaud cabinet delivery — provision restaurant + BTP leads.
 *
 * Usage:
 *   pnpm bootstrap-pierremeniaud-booking -- --dry-run
 *   pnpm bootstrap-pierremeniaud-booking -- --confirm
 *   pnpm bootstrap-pierremeniaud-booking -- --confirm --resync-all
 */
import { createClientsClient, findClientById } from "@/lib/clients/supabase";
import {
  getEnabledVerticals,
  loadClientBookingConfig,
} from "@/lib/clients/booking-config/load";
import {
  getComptableDeliveryVertical,
  type ComptableDeliveryRouteSegment,
  type ComptableDeliveryVerticalKey,
} from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import { provisionLinksFromList } from "@/lib/legacy/link-tracking/provision-from-list";

const dryRun = process.argv.includes("--dry-run");
const confirm = process.argv.includes("--confirm");
const resyncAll = process.argv.includes("--resync-all");
const maxLeadsArg = process.argv.find((arg) => arg.startsWith("--max-leads="));
const maxLeads = maxLeadsArg
  ? Number.parseInt(maxLeadsArg.split("=")[1]?.trim() ?? "", 10)
  : null;

/** Supabase rows still tied to the pre-DCE BTP Instantly campaign. */
const LEGACY_BTP_CAMPAIGN_ID = "05bc06f8-4f60-4e6c-bae1-7afe30df38c7";
const LEGACY_BTP_LIST_ID = "d4bc89f7-b271-4ed7-9539-4ac968bfb7c9";

function logProvisionSummary(
  result: Awaited<ReturnType<typeof provisionLinksFromList>>,
  source: string,
): void {
  const { customVariablesByEmail: _vars, ...summary } = result;
  console.log(
    JSON.stringify(
      {
        ...summary,
        source,
        customVariablesSampleCount: Object.keys(_vars ?? {}).length,
      },
      null,
      2,
    ),
  );
}

async function provisionMeniaudVertical(
  config: ReturnType<typeof loadClientBookingConfig>,
  key: string,
  vertical: (typeof config.verticals)[string],
  campaignId: string,
  listId: string,
): Promise<void> {
  const provisionArgs = {
    campaignId,
    category: "comptable_delivery" as const,
    resyncAll,
    maxLeads: Number.isFinite(maxLeads) && maxLeads! > 0 ? maxLeads : null,
    comptableDeliverySegment: vertical.comptableDeliverySegment,
    comptableDeliveryRouteSegment:
      vertical.routeSegment as ComptableDeliveryRouteSegment,
    fixedClientId: config.clientId,
  };

  const campaignResult = await provisionLinksFromList({
    ...provisionArgs,
    fromCampaign: true,
  });
  const listResult = await provisionLinksFromList({
    ...provisionArgs,
    listId,
    fromCampaign: false,
  });

  logProvisionSummary(campaignResult, "campaign");
  logProvisionSummary(listResult, "list");
}

async function main() {
  if (!dryRun && !confirm) {
    console.error("Pass --dry-run or --confirm");
    process.exit(1);
  }

  const config = loadClientBookingConfig("pierremeniaud");
  const supabase = createClientsClient();
  const client = await findClientById(supabase, config.clientId);

  if (!client) {
    throw new Error(`Client not found: ${config.clientId}`);
  }
  if (client.email.trim().toLowerCase() !== config.clientEmail.toLowerCase()) {
    throw new Error(
      `Client email mismatch: expected ${config.clientEmail}, got ${client.email}`,
    );
  }

  const verticals = getEnabledVerticals(config);
  if (verticals.length === 0) {
    throw new Error("No enabled verticals in pierremeniaud.json");
  }

  console.log(`Bootstrap ${config.clientKey} (${client.email})`);
  console.log(`Mode: ${dryRun ? "dry-run" : "confirm"} resyncAll=${resyncAll}`);

  for (const { key, vertical } of verticals) {
    console.log(`\n— Vertical ${key} (campaign ${vertical.instantlyCampaignId})`);
    if (dryRun) {
      console.log("  Skipping provision (dry-run)");
      continue;
    }

    const verticalMeta = getComptableDeliveryVertical(
      key as ComptableDeliveryVerticalKey,
    );
    await provisionMeniaudVertical(
      config,
      key,
      vertical,
      vertical.instantlyCampaignId,
      verticalMeta.listId,
    );
  }

  const btpVertical = config.verticals.btp;
  if (!dryRun && btpVertical?.enabled) {
    console.log(
      `\n— Legacy BTP backfill (campaign ${LEGACY_BTP_CAMPAIGN_ID})`,
    );
    try {
      await provisionMeniaudVertical(
        config,
        "btp-legacy",
        btpVertical,
        LEGACY_BTP_CAMPAIGN_ID,
        LEGACY_BTP_LIST_ID,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("404") && message.includes("Campaign not found")) {
        console.warn(
          "  Skipping legacy BTP backfill: Instantly campaign no longer exists.",
        );
      } else {
        throw err;
      }
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
