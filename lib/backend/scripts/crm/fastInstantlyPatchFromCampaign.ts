/**
 * Patch Instantly custom vars using FRESH lead IDs from the campaign,
 * matched to Supabase by email (fixes stale instantly_lead_id).
 *
 *   CATEGORY=jum CAMPAIGN_ID=... INSTANTLY_PATCH_CONCURRENCY=24 \
 *     pnpm tsx --env-file=.env ./scripts/crm/fastInstantlyPatchFromCampaign.ts
 */
import {
  fetchLeadsFromCampaign,
  getInstantlyApiKey,
  patchLeadsCustomVariablesParallel,
} from "@/lib/instantly";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { buildInstantlyCustomVariables, leadSlug } from "@/lib/legacy/link-tracking/urls";

const category = (process.env.CATEGORY?.trim() || "comptable_delivery") as LeadCategory;
const campaignId = process.env.CAMPAIGN_ID?.trim();
const concurrency = Number.parseInt(
  process.env.INSTANTLY_PATCH_CONCURRENCY?.trim() || "24",
  10,
);
const updateIds = process.env.UPDATE_IDS === "1";

if (!campaignId) {
  throw new Error("CAMPAIGN_ID required");
}

async function loadSupabaseByEmail(
  cat: LeadCategory,
  campaign: string,
): Promise<Map<string, LinkTrackingLead>> {
  const client = createLinkTrackingClient();
  const map = new Map<string, LinkTrackingLead>();
  const pageSize = 1000;
  let offset = 0;
  for (;;) {
    const { data, error } = await client
      .from(cat)
      .select("*")
      .eq("instantly_campaign_id", campaign)
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as LinkTrackingLead[];
    if (rows.length === 0) break;
    for (const row of rows) {
      map.set(row.email.trim().toLowerCase(), row);
    }
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return map;
}

async function main(): Promise<void> {
  const apiKey = getInstantlyApiKey();
  const client = createLinkTrackingClient();
  console.log(JSON.stringify({ category, campaignId, concurrency }));

  const [byEmail, campaignLeads] = await Promise.all([
    loadSupabaseByEmail(category, campaignId!),
    fetchLeadsFromCampaign(apiKey, campaignId!, { maxLeads: null }),
  ]);

  console.log(
    JSON.stringify({
      supabase: byEmail.size,
      instantly: campaignLeads.length,
    }),
  );

  const items: Array<{ leadId: string; customVariables: Record<string, string> }> =
    [];
  const idUpdates: Array<{ email: string; leadId: string; rowId: string }> = [];
  let missingSupabase = 0;
  let noSlug = 0;

  for (const lead of campaignLeads) {
    const email = lead.email?.trim().toLowerCase();
    const leadId = lead.id?.trim();
    if (!email || !leadId) continue;
    const row = byEmail.get(email);
    if (!row) {
      missingSupabase += 1;
      continue;
    }
    const slug = leadSlug(row);
    if (!slug) {
      noSlug += 1;
      continue;
    }
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
    if (updateIds && row.instantly_lead_id !== leadId && row.id) {
      idUpdates.push({ email, leadId, rowId: row.id });
    }
  }

  console.log(
    JSON.stringify({
      toPatch: items.length,
      missingSupabase,
      noSlug,
      idUpdates: idUpdates.length,
    }),
  );

  // Patch in chunks of 500 so progress is visible
  let patched = 0;
  let failed = 0;
  const chunk = 500;
  for (let i = 0; i < items.length; i += chunk) {
    const slice = items.slice(i, i + chunk);
    const stats = await patchLeadsCustomVariablesParallel(
      apiKey,
      slice,
      Number.isFinite(concurrency) ? concurrency : 24,
    );
    patched += stats.patched;
    failed += stats.failed;
    console.log(
      `patched=${patched}/${items.length} failed=${failed} (+${stats.failed} this chunk)`,
    );
  }

  // Refresh stale Instantly IDs in Supabase (batched)
  if (idUpdates.length > 0) {
    let updated = 0;
    for (const u of idUpdates) {
      const { error } = await client
        .from(category)
        .update({ instantly_lead_id: u.leadId })
        .eq("id", u.rowId);
      if (!error) updated += 1;
    }
    console.log(JSON.stringify({ idsRefreshed: updated, attempted: idUpdates.length }));
  }

  console.log(JSON.stringify({ category, campaignId, patched, failed }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
