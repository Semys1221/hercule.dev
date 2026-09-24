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
import type { ComptableDeliveryRouteSegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import { provisionLinksFromList } from "@/lib/legacy/link-tracking/provision-from-list";

const dryRun = process.argv.includes("--dry-run");
const confirm = process.argv.includes("--confirm");
const resyncAll = process.argv.includes("--resync-all");

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

    const result = await provisionLinksFromList({
      campaignId: vertical.instantlyCampaignId,
      category: "comptable_delivery",
      fromCampaign: true,
      resyncAll,
      comptableDeliverySegment: vertical.comptableDeliverySegment,
      comptableDeliveryRouteSegment:
        vertical.routeSegment as ComptableDeliveryRouteSegment,
      fixedClientId: config.clientId,
    });

    console.log(JSON.stringify(result, null, 2));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
