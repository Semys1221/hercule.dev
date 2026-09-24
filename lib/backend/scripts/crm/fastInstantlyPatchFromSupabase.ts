/**
 * Fast Instantly-only PATCH from Supabase rows for a campaign.
 *
 *   CATEGORY=comptable CAMPAIGN_ID=e4c58718-... INSTANTLY_PATCH_CONCURRENCY=40 \
 *     pnpm tsx --env-file=.env ./scripts/crm/fastInstantlyPatchFromSupabase.ts
 */
import { getInstantlyApiKey, patchLeadsCustomVariablesParallel } from "@/lib/instantly";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { buildInstantlyCustomVariables, leadSlug } from "@/lib/legacy/link-tracking/urls";

const category = (process.env.CATEGORY?.trim() || "comptable") as LeadCategory;
const campaignId =
  process.env.CAMPAIGN_ID?.trim() || "e4c58718-ca00-4e27-b714-68e522fe4db6";
const concurrency = Number.parseInt(
  process.env.INSTANTLY_PATCH_CONCURRENCY?.trim() || "8",
  10,
);
const startOffset = Number.parseInt(process.env.OFFSET?.trim() || "0", 10);
const pageSize = 500;

async function main(): Promise<void> {
  const client = createLinkTrackingClient();
  const apiKey = getInstantlyApiKey();
  let offset = Number.isFinite(startOffset) ? Math.max(0, startOffset) : 0;
  let patched = 0;
  let failed = 0;
  let scanned = offset;
  console.log(
    JSON.stringify({
      category,
      campaignId,
      concurrency: Number.isFinite(concurrency) ? concurrency : 8,
      startOffset: offset,
    }),
  );

  for (;;) {
    const { data, error } = await client
      .from(category)
      .select("*")
      .eq("instantly_campaign_id", campaignId)
      .not("instantly_lead_id", "is", null)
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as LinkTrackingLead[];
    if (rows.length === 0) break;
    scanned += rows.length;

    const items: Array<{ leadId: string; customVariables: Record<string, string> }> =
      [];
    for (const row of rows) {
      const slug = leadSlug(row);
      const leadId = row.instantly_lead_id?.trim();
      if (!slug || !leadId) continue;
      const jumSegment =
        category === "comptable_delivery" && typeof row.profile?.segment === "string"
          ? row.profile.segment
          : null;
      items.push({
        leadId,
        customVariables: buildInstantlyCustomVariables(
          slug,
          row.email,
          row.statut ?? "NOTBOOKED",
          category,
          category === "comptable_delivery" ? { jumSegment } : undefined,
        ),
      });
    }

    if (items.length > 0) {
      const stats = await patchLeadsCustomVariablesParallel(
        apiKey,
        items,
        Number.isFinite(concurrency) ? concurrency : 40,
      );
      patched += stats.patched;
      failed += stats.failed;
    }

    console.log(`scanned=${scanned} patched=${patched} failed=${failed}`);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  console.log(JSON.stringify({ category, campaignId, scanned, patched, failed }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
