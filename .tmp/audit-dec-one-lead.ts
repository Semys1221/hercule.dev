import { getInstantlyApiKey } from "@/lib/instantly";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const EMAIL = "info@acc-uyt.be";

async function main() {
  const c = createLinkTrackingClient();
  const { data: row } = await c
    .from("comptable")
    .select("*")
    .eq("email", EMAIL)
    .maybeSingle();

  const apiKey = getInstantlyApiKey();
  const leadId = String(row?.instantly_lead_id ?? "").trim();
  let instantly: Record<string, unknown> | null = null;
  if (leadId) {
    const res = await fetch(`https://api.instantly.ai/api/v2/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    instantly = (await res.json()) as Record<string, unknown>;
  }

  console.log(
    JSON.stringify(
      {
        supabase: row
          ? {
              slug: row.slug,
              reservation_comptable_link: row.reservation_comptable_link,
              instantly_lead_id: row.instantly_lead_id,
              instantly_campaign_id: row.instantly_campaign_id,
            }
          : null,
        instantly: instantly
          ? {
              id: instantly.id,
              email: instantly.email,
              campaign: instantly.campaign,
              payload: instantly.payload,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

main().catch(console.error);
