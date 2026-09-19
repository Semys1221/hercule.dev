import { fetchLeadsFromCampaign, getInstantlyApiKey } from "@/lib/instantly";
import { createLinkTrackingClient, normalizeEmail } from "@/lib/link-tracking/supabase";

const CAMPAIGN = "e4c58718-ca00-4e27-b714-68e522fe4db6";

async function main() {
  const apiKey = getInstantlyApiKey();
  const leads = await fetchLeadsFromCampaign(apiKey, CAMPAIGN, { maxPages: 200 });
  const missingEmails: string[] = [];

  for (const lead of leads) {
    const cv = (lead.payload ?? {}) as Record<string, string>;
    const ent = String(cv.reservation_entreprise_link ?? "").trim();
    if (!ent) missingEmails.push(normalizeEmail(String(lead.email ?? "")));
  }

  const c = createLinkTrackingClient();
  const { data: rows } = await c
    .from("comptable")
    .select("email, slug, reservation_comptable_link, instantly_lead_id")
    .in("email", missingEmails.slice(0, 500));

  const inDb = rows?.length ?? 0;
  const withLink = rows?.filter((r) => r.reservation_comptable_link?.trim()).length ?? 0;
  const withSlug = rows?.filter((r) => r.slug?.trim()).length ?? 0;

  console.log(
    JSON.stringify(
      {
        missingInstantly: missingEmails.length,
        checkedInSupabase: Math.min(missingEmails.length, 500),
        foundInSupabase: inDb,
        withComptableLink: withLink,
        withSlug,
        notInSupabase: Math.min(missingEmails.length, 500) - inDb,
        sampleNotInDb: missingEmails
          .filter((e) => !rows?.some((r) => normalizeEmail(r.email) === e))
          .slice(0, 10),
        sampleInDbUnpatched: rows
          ?.filter((r) => r.reservation_comptable_link?.trim())
          .slice(0, 5)
          .map((r) => ({
            email: r.email,
            slug: r.slug,
            link: String(r.reservation_comptable_link).slice(0, 80),
          })),
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
