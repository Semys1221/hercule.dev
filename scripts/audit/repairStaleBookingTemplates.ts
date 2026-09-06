/**
 * Repair stale entreprise booking_email_templates rows (agence copy / {{confirmUrl}}).
 *
 * Usage: pnpm repair-stale-booking-templates
 */

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  isStaleAgenceCopyOnEntreprise,
  pickBookingEmailTemplate,
} from "@/lib/booking-communication/template-store";
import { defaultBookingEmailTemplate } from "@/lib/booking-communication/templates";

async function main() {
  const client = createLinkTrackingClient();
  const { data: rows, error } = await client
    .from("booking_email_templates")
    .select("category, email_type, subject, body")
    .eq("category", "entreprise")
    .in("email_type", ["h48_confirm", "h24_relance"]);

  if (error) {
    throw new Error(error.message);
  }

  let repaired = 0;
  for (const row of rows ?? []) {
    if (
      !isStaleAgenceCopyOnEntreprise(
        row.category,
        row.email_type,
        row.subject,
        row.body,
      )
    ) {
      continue;
    }

    const resolved = pickBookingEmailTemplate({
      category: "entreprise",
      emailType: row.email_type,
      stored: { subject: row.subject, body: row.body },
    });

    const { error: updateError } = await client
      .from("booking_email_templates")
      .update({ subject: resolved.subject, body: resolved.body })
      .eq("category", row.category)
      .eq("email_type", row.email_type);

    if (updateError) {
      throw new Error(`${row.email_type}: ${updateError.message}`);
    }

    repaired += 1;
    console.log(`repaired ${row.category}/${row.email_type}`);
  }

  console.log(`repairStaleBookingTemplates: ${repaired} row(s) updated`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
