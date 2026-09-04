/**
 * One-shot: start booking sequence for an existing MEETING_BOOKED lead.
 * Usage: pnpm exec tsx --env-file=.env scripts/crm/triggerBookingForLead.ts <lead_id> [agence|entreprise]
 */
import { startBookingSequence } from "@/lib/booking-communication/orchestrator";
import {
  createLinkTrackingClient,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

async function main(): Promise<void> {
  const leadId = process.argv[2]?.trim();
  const category = (process.argv[3]?.trim() || "agence") as LeadCategory;
  if (!leadId) {
    throw new Error("Usage: triggerBookingForLead.ts <lead_id> [agence|entreprise]");
  }
  if (category !== "agence" && category !== "entreprise") {
    throw new Error("category must be agence or entreprise");
  }

  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, category, leadId);
  if (!lead) {
    throw new Error(`lead_not_found: ${category}/${leadId}`);
  }

  console.log(
    JSON.stringify({
      email: lead.email,
      statut: lead.statut,
      scheduled_at: lead.scheduled_at,
    }),
  );

  const seq = await startBookingSequence({
    category,
    lead,
    triggeredBy: "manual",
  });

  console.log(JSON.stringify({ ok: true, ...seq }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
