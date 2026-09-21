import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

async function main() {
  const c = createLinkTrackingClient();
  const campaigns = [
    ["comptable", "e4c58718-ca00-4e27-b714-68e522fe4db6"],
    ["cif", "e3bdb573-fe9f-437d-bd96-4ceb52869dd4"],
    ["jum", "e4f11e76-717e-4be9-a6ad-c7f0a331afb7"],
    ["jum", "05bc06f8-4f60-4e6c-bae1-7afe30df38c7"],
    ["jum", "0f0b450a-e550-461c-96f6-1a7681678d67"],
  ] as const;

  for (const [cat, id] of campaigns) {
    const { count: total } = await c
      .from(cat)
      .select("*", { count: "exact", head: true })
      .eq("instantly_campaign_id", id);
    const { count: withId } = await c
      .from(cat)
      .select("*", { count: "exact", head: true })
      .eq("instantly_campaign_id", id)
      .not("instantly_lead_id", "is", null);
    const { data: sample } = await c
      .from(cat)
      .select(
        "email,slug,reservation_conference_link,reservation_entreprise_link,reservation_jum_link,statut,instantly_lead_id,profile",
      )
      .eq("instantly_campaign_id", id)
      .limit(1);
    const s = sample?.[0] as Record<string, unknown> | undefined;
    console.log(
      JSON.stringify({
        cat,
        id: id.slice(0, 8),
        total,
        withId,
        sample: s
          ? {
              email: s.email,
              slug: s.slug,
              conf: String(s.reservation_conference_link ?? "").slice(0, 70),
              ent: String(s.reservation_entreprise_link ?? "").slice(0, 70),
              jum: String(s.reservation_jum_link ?? "").slice(0, 70),
              statut: s.statut,
              hasLeadId: Boolean(s.instantly_lead_id),
              seg: (s.profile as { segment?: string } | null)?.segment,
            }
          : null,
      }),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
