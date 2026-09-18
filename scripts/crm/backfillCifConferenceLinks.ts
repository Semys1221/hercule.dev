/**
 * Backfill CIF reservation_cif_link → reservation-conference.html and refresh Instantly vars.
 *
 * Usage:
 *   pnpm backfill-cif-conference-links
 *   pnpm backfill-cif-conference-links -- --dry-run
 *   pnpm backfill-cif-conference-links -- --links-only
 */
import { provisionLinksFromList } from "@/lib/link-tracking/provision-from-list";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const CIF_CAMPAIGN_ID = "e3bdb573-fe9f-437d-bd96-4ceb52869dd4";
const LEGACY_PREFIX = "https://www.hercule.dev/reservation-cif.html";
const CONFERENCE_PREFIX = "https://www.hercule.dev/reservation-conference.html";

const E1_BODY_HTML =
  "Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>L'expertise recherchée porte sur le placement des avoirs professionnels et privés et la réduction de la pression fiscale.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez que nous vous mettions en relation avec ces cabinets : <a href=\"{{reservation_cif_link}}\">Mon cabinet est compatible</a><br/><br/>L'appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).<br/><br/>{{accountSignature}}";

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

async function backfillCifLinks(): Promise<number> {
  const client = createLinkTrackingClient();
  let updated = 0;

  for (;;) {
    const { data, error } = await client
      .from("cif")
      .select("id, reservation_cif_link")
      .ilike("reservation_cif_link", "%reservation-cif.html%")
      .limit(BATCH_SIZE);

    if (error) {
      throw new Error(`CIF link fetch failed: ${error.message}`);
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      break;
    }

    const pending = rows
      .map((row) => {
        const current = row.reservation_cif_link?.trim();
        if (!current?.includes("reservation-cif.html")) {
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
          .from("cif")
          .update({ reservation_cif_link: row.next, updated_at: new Date().toISOString() })
          .eq("id", row.id);

        if (updateError) {
          throw new Error(`CIF link update failed for ${row.id}: ${updateError.message}`);
        }
      });
      updated += pending.length;
      process.stdout.write(`\r  cif links updated: ${updated}`);
    }
  }

  if (!dryRun && updated > 0) {
    process.stdout.write("\n");
  }

  return updated;
}

async function updateE1Template(): Promise<void> {
  const client = createLinkTrackingClient();
  if (dryRun) {
    console.log("[dry-run] would update CIF interested_email1 template");
    return;
  }

  const { error } = await client
    .from("instantly_bypass_templates")
    .update({ body_html: E1_BODY_HTML, updated_at: new Date().toISOString() })
    .eq("campaign_id", CIF_CAMPAIGN_ID)
    .eq("template_key", "interested_email1");

  if (error) {
    throw new Error(`E1 template update failed: ${error.message}`);
  }
}

async function countLinks(pattern: string): Promise<number> {
  const client = createLinkTrackingClient();
  const { count, error } = await client
    .from("cif")
    .select("*", { count: "exact", head: true })
    .ilike("reservation_cif_link", pattern);

  if (error) {
    throw new Error(`Count failed: ${error.message}`);
  }
  return count ?? 0;
}

async function main(): Promise<void> {
  console.log(`CIF conference link backfill (${dryRun ? "dry-run" : "execute"})`);

  const beforeLegacy = await countLinks("%reservation-cif.html%");
  const beforeConference = await countLinks("%reservation-conference%");
  console.log(`Before: legacy=${beforeLegacy} conference=${beforeConference}`);

  await updateE1Template();
  const linksUpdated = await backfillCifLinks();
  console.log(`CIF links ${dryRun ? "would update" : "updated"}: ${linksUpdated}`);

  if (dryRun || linksOnly) {
    console.log(`${dryRun ? "Dry-run" : "Links-only"} complete — skipping Instantly resync.`);
    const afterLegacy = await countLinks("%reservation-cif.html%");
    const afterConference = await countLinks("%reservation-conference%");
    console.log(`After: legacy=${afterLegacy} conference=${afterConference}`);
    return;
  }

  const resync = await provisionLinksFromList({
    campaignId: CIF_CAMPAIGN_ID,
    category: "cif",
    fromCampaign: true,
    resyncAll: true,
  });

  const afterLegacy = await countLinks("%reservation-cif.html%");
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
