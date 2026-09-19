import { getInstantlyApiKey } from "@/lib/instantly";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const CAMPAIGN = "e4c58718-ca00-4e27-b714-68e522fe4db6";

async function scanInstantly() {
  const apiKey = getInstantlyApiKey();
  let cursor: string | undefined;
  let total = 0;
  let missingEnt = 0;
  let hasEnt = 0;
  let hasConference = 0;
  let hasComptable = 0;
  const sampleMissing: Array<{ email: string; created: string }> = [];
  const sampleRecent: Array<{
    email: string;
    created: string;
    ent: string;
    comp: string;
  }> = [];

  while (true) {
    const url = new URL("https://api.instantly.ai/api/v2/leads");
    url.searchParams.set("campaign", CAMPAIGN);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("starting_after", cursor);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = (await res.json()) as {
      items?: Array<{
        id: string;
        email?: string;
        timestamp_created?: string;
        payload?: Record<string, string>;
      }>;
    };
    const items = body.items ?? [];
    if (!items.length) break;

    for (const lead of items) {
      total++;
      const cv = lead.payload ?? {};
      const ent = String(cv.reservation_entreprise_link ?? "").trim();
      const comp = String(cv.reservation_comptable_link ?? "").trim();
      const conf = String(cv.reservation_conference_link ?? "").trim();
      if (ent) hasEnt++;
      else {
        missingEnt++;
        if (sampleMissing.length < 10) {
          sampleMissing.push({
            email: String(lead.email ?? ""),
            created: String(lead.timestamp_created ?? ""),
          });
        }
      }
      if (comp) hasComptable++;
      if (conf) hasConference++;
      if (sampleRecent.length < 10) {
        sampleRecent.push({
          email: String(lead.email ?? ""),
          created: String(lead.timestamp_created ?? ""),
          ent: ent.slice(0, 80),
          comp: comp.slice(0, 80),
        });
      }
    }

    cursor = items[items.length - 1]?.id;
    if (items.length < 100) break;
  }

  return {
    total,
    hasEnt,
    missingEnt,
    hasComptable,
    hasConference,
    sampleMissing,
    sampleRecent,
  };
}

async function scanSupabase() {
  const c = createLinkTrackingClient();
  const { count: total } = await c
    .from("comptable")
    .select("*", { count: "exact", head: true })
    .eq("instantly_campaign_id", CAMPAIGN);

  const { count: withComptableLink } = await c
    .from("comptable")
    .select("*", { count: "exact", head: true })
    .eq("instantly_campaign_id", CAMPAIGN)
    .not("reservation_comptable_link", "is", null)
    .neq("reservation_comptable_link", "");

  const { count: withEntrepriseLink } = await c
    .from("comptable")
    .select("*", { count: "exact", head: true })
    .eq("instantly_campaign_id", CAMPAIGN)
    .not("reservation_entreprise_link", "is", null)
    .neq("reservation_entreprise_link", "");

  const { count: missingSlug } = await c
    .from("comptable")
    .select("*", { count: "exact", head: true })
    .eq("instantly_campaign_id", CAMPAIGN)
    .or("slug.is.null,slug.eq.");

  const { data: recent } = await c
    .from("comptable")
    .select("email, slug, reservation_comptable_link, instantly_lead_id, created_at")
    .eq("instantly_campaign_id", CAMPAIGN)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    total,
    withComptableLink,
    withEntrepriseLink,
    missingSlug,
    recent,
  };
}

async function main() {
  const [instantly, supabase] = await Promise.all([
    scanInstantly(),
    scanSupabase(),
  ]);
  console.log(JSON.stringify({ instantly, supabase }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
