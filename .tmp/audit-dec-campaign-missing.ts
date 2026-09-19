import { fetchLeadsFromCampaign, getInstantlyApiKey } from "@/lib/instantly";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const CAMPAIGN = "e4c58718-ca00-4e27-b714-68e522fe4db6";

async function main() {
  const apiKey = getInstantlyApiKey();
  const leads = await fetchLeadsFromCampaign(apiKey, CAMPAIGN, { maxPages: 200 });

  let missingEnt = 0;
  let hasEnt = 0;
  let emailOnly = 0;
  const sampleMissing: string[] = [];

  for (const lead of leads) {
    const cv = (lead.payload ?? {}) as Record<string, string>;
    const keys = Object.keys(cv).filter((k) => k !== "email");
    if (keys.length === 0) emailOnly++;
    const ent = String(cv.reservation_entreprise_link ?? "").trim();
    if (ent) hasEnt++;
    else {
      missingEnt++;
      if (sampleMissing.length < 25) {
        sampleMissing.push(String(lead.email ?? ""));
      }
    }
  }

  const c = createLinkTrackingClient();
  const { count: supabaseCount } = await c
    .from("comptable")
    .select("*", { count: "exact", head: true })
    .eq("instantly_campaign_id", CAMPAIGN);

  console.log(
    JSON.stringify(
      {
        campaignLeads: leads.length,
        supabaseRows: supabaseCount,
        gap: leads.length - (supabaseCount ?? 0),
        hasEnt,
        missingEnt,
        emailOnly,
        sampleMissing,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
