/**
 * Remove date-specific September window line from interested_email1 bypass templates.
 *
 * Usage: pnpm repair-dated-bypass-e1
 */

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const DATED_LINE =
  /Les premiers échanges entre cabinets et agences marketing sont disponibles du 8 au 27 septembre\.\s*(<br\s*\/?>)?\s*/gi;

async function main() {
  const client = createLinkTrackingClient();
  const { data: rows, error } = await client
    .from("instantly_bypass_templates")
    .select("campaign_id, template_key, body_html")
    .eq("template_key", "interested_email1");

  if (error) {
    throw new Error(error.message);
  }

  let repaired = 0;
  for (const row of rows ?? []) {
    const body = row.body_html ?? "";
    if (!DATED_LINE.test(body)) {
      DATED_LINE.lastIndex = 0;
      continue;
    }
    DATED_LINE.lastIndex = 0;
    const nextBody = body.replace(DATED_LINE, "");
    if (nextBody === body) continue;

    const { error: updateError } = await client
      .from("instantly_bypass_templates")
      .update({ body_html: nextBody })
      .eq("campaign_id", row.campaign_id)
      .eq("template_key", row.template_key);

    if (updateError) {
      throw new Error(`${row.campaign_id}: ${updateError.message}`);
    }

    repaired += 1;
    console.log(`repaired ${row.campaign_id}/interested_email1`);
  }

  console.log(`repairDatedBypassE1: ${repaired} row(s) updated`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
