/**
 * Backfill comptable reservation_comptable_link → reservation-conference.html and refresh Instantly vars.
 *
 * Usage:
 *   pnpm backfill-comptable-conference-links
 *   pnpm backfill-comptable-conference-links -- --dry-run
 *   pnpm backfill-comptable-conference-links -- --links-only
 */
import { provisionLinksFromList } from "@/lib/link-tracking/provision-from-list";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const COMPTABLE_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6";
const LEGACY_PREFIX = "https://www.hercule.dev/reservation-entreprise.html";
const CONFERENCE_PREFIX = "https://www.hercule.dev/reservation-conference.html";

const BATCH_SIZE = 200;
const UPDATE_CONCURRENCY = 25;
const dryRun = process.argv.includes("--dry-run");
const linksOnly = process.argv.includes("--links-only");

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

async function backfillComptableLinks(): Promise<number> {
  const client = createLinkTrackingClient();
  let updated = 0;

  for (;;) {
    const { data, error } = await client
      .from("comptable")
      .select("id, reservation_comptable_link")
      .ilike("reservation_comptable_link", "%reservation-entreprise.html%")
      .limit(BATCH_SIZE);

    if (error) {
      throw new Error(`Comptable link fetch failed: ${error.message}`);
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      break;
    }

    const pending = rows
      .map((row) => {
        const current = row.reservation_comptable_link?.trim();
        if (!current?.includes("reservation-entreprise.html")) {
          return null;
        }
        return {
          id: row.id,
          next: current.replace(LEGACY_PREFIX, CONFERENCE_PREFIX),
        };
      })
      .filter((row): row is { id: string; next: string } => row !== null);

    if (dryRun) {
      updated += pending.length;
    } else {
      await mapWithConcurrency(pending, UPDATE_CONCURRENCY, async (row) => {
        const { error: updateError } = await client
          .from("comptable")
          .update({
            reservation_comptable_link: row.next,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        if (updateError) {
          throw new Error(`Comptable link update failed for ${row.id}: ${updateError.message}`);
        }
      });
      updated += pending.length;
      process.stdout.write(`\r  comptable links updated: ${updated}`);
    }
  }

  if (!dryRun && updated > 0) {
    process.stdout.write("\n");
  }

  return updated;
}

async function countLinks(pattern: string): Promise<number> {
  const client = createLinkTrackingClient();
  const { count, error } = await client
    .from("comptable")
    .select("*", { count: "exact", head: true })
    .ilike("reservation_comptable_link", pattern);

  if (error) {
    throw new Error(`Count failed: ${error.message}`);
  }
  return count ?? 0;
}

async function main(): Promise<void> {
  console.log(`Comptable conference link backfill (${dryRun ? "dry-run" : "execute"})`);

  const beforeLegacy = await countLinks("%reservation-entreprise.html%");
  const beforeConference = await countLinks("%reservation-conference%");
  console.log(`Before: legacy=${beforeLegacy} conference=${beforeConference}`);

  const linksUpdated = await backfillComptableLinks();
  console.log(`Comptable links ${dryRun ? "would update" : "updated"}: ${linksUpdated}`);

  if (dryRun || linksOnly) {
    console.log(`${dryRun ? "Dry-run" : "Links-only"} complete — skipping Instantly resync.`);
    const afterLegacy = await countLinks("%reservation-entreprise.html%");
    const afterConference = await countLinks("%reservation-conference%");
    console.log(`After: legacy=${afterLegacy} conference=${afterConference}`);
    return;
  }

  const resync = await provisionLinksFromList({
    campaignId: COMPTABLE_CAMPAIGN_ID,
    category: "comptable",
    fromCampaign: true,
    resyncAll: true,
  });

  const afterLegacy = await countLinks("%reservation-entreprise.html%");
  const afterConference = await countLinks("%reservation-conference%");

  console.log(
    JSON.stringify(
      {
        linksUpdated,
        afterLegacy,
        afterConference,
        instantly: {
          selected: resync.selected,
          updated: resync.updated,
          patched: resync.patched,
          failed: resync.failed,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
