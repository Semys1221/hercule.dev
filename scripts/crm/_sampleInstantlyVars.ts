import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { getInstantlyApiKey } from "@/lib/instantly";

async function main() {
  const c = createLinkTrackingClient();
  const apiKey = getInstantlyApiKey();

  const targets = [
    {
      cat: "comptable",
      id: "e4c58718-ca00-4e27-b714-68e522fe4db6",
      expect: "conference",
    },
    {
      cat: "cif",
      id: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
      expect: "conference",
    },
    {
      cat: "jum",
      id: "e4f11e76-717e-4be9-a6ad-c7f0a331afb7",
      expect: "jum",
    },
  ] as const;

  for (const t of targets) {
    const { data, error } = await c
      .from(t.cat)
      .select("email,slug,instantly_lead_id,reservation_conference_link,reservation_entreprise_link,reservation_jum_link,profile")
      .eq("instantly_campaign_id", t.id)
      .not("instantly_lead_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.log(JSON.stringify({ cat: t.cat, error: error.message }));
      continue;
    }
    if (!data) {
      console.log(JSON.stringify({ cat: t.cat, empty: true }));
      continue;
    }

    const leadId = String(data.instantly_lead_id);
    const res = await fetch(`https://api.instantly.ai/api/v2/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = (await res.json()) as {
      email?: string;
      custom_variables?: Record<string, string>;
    };
    const cv = body.custom_variables ?? {};
    console.log(
      JSON.stringify(
        {
          cat: t.cat,
          email: data.email,
          supabase: {
            conf: data.reservation_conference_link,
            ent: data.reservation_entreprise_link,
            jum: data.reservation_jum_link,
            seg: (data.profile as { segment?: string } | null)?.segment,
          },
          instantly: {
            reservation_conference_link: cv.reservation_conference_link,
            reservation_entreprise_link: cv.reservation_entreprise_link,
            reservation_jum_link: cv.reservation_jum_link,
            jum_segment: cv.jum_segment,
            booking_status: cv.booking_status,
          },
        },
        null,
        2,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
