import { getInstantlyApiKey } from "@/lib/instantly";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const CAMPAIGN = "e4c58718-ca00-4e27-b714-68e522fe4db6";

async function fetchInstantlyLead(leadId: string) {
  const apiKey = getInstantlyApiKey();
  const res = await fetch(`https://api.instantly.ai/api/v2/leads/${leadId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    email?: string;
    payload?: Record<string, string>;
    custom_variables?: Record<string, string>;
  };
}

async function main() {
  const c = createLinkTrackingClient();

  const { data: rows, error } = await c
    .from("comptable")
    .select("email, slug, reservation_comptable_link, instantly_lead_id, created_at")
    .eq("instantly_campaign_id", CAMPAIGN)
    .not("instantly_lead_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  let checked = 0;
  let missingInstantlyEnt = 0;
  let missingInstantlyComptable = 0;
  let hasInstantlyEnt = 0;
  let wrongUrl = 0;
  const samples: Array<Record<string, unknown>> = [];

  for (const row of rows ?? []) {
    const leadId = String(row.instantly_lead_id ?? "").trim();
    if (!leadId) continue;
    checked++;
    const instantly = await fetchInstantlyLead(leadId);
    const cv = instantly?.payload ?? instantly?.custom_variables ?? {};
    const ent = String(cv.reservation_entreprise_link ?? "").trim();
    const comp = String(cv.reservation_comptable_link ?? "").trim();
    const expected = String(row.reservation_comptable_link ?? "").trim();

    if (ent) hasInstantlyEnt++;
    else missingInstantlyEnt++;
    if (!comp) missingInstantlyComptable++;
    if (ent && expected && !ent.includes(row.slug)) wrongUrl++;

    if (
      samples.length < 15 &&
      (!ent || (expected && ent !== expected && !ent.includes("reservation-conference")))
    ) {
      samples.push({
        email: row.email,
        slug: row.slug,
        supabase: expected.slice(0, 90),
        instantlyEnt: ent.slice(0, 90),
        instantlyComptable: comp.slice(0, 90),
        created_at: row.created_at,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        checked,
        hasInstantlyEnt,
        missingInstantlyEnt,
        missingInstantlyComptable,
        wrongUrl,
        samples,
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
