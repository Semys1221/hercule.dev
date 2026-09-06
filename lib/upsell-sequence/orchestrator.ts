import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import { scheduleLeadEmailJobs } from "@/lib/booking-communication/product-send";
import type { SalesCall } from "@/lib/sales-calls/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function startUpsellSequence(
  salesCall: SalesCall,
): Promise<{ started: boolean; reason?: string }> {
  if (!salesCall.agence_id) {
    return { started: false, reason: "missing_agence_id" };
  }

  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, "agence", salesCall.agence_id);
  if (!lead) {
    return { started: false, reason: "lead_not_found" };
  }

  const now = new Date();
  const { inserted } = await scheduleLeadEmailJobs({
    category: "agence",
    leadId: lead.id,
    triggeredBy: "sales_call_completed",
    jobs: [
      {
        emailType: "upsell_email_1",
        scheduledFor: now,
        idempotencyKey: `upsell:1:${salesCall.id}`,
      },
      {
        emailType: "upsell_email_2",
        scheduledFor: new Date(now.getTime() + 7 * DAY_MS),
        idempotencyKey: `upsell:2:${salesCall.id}`,
      },
      {
        emailType: "upsell_email_3",
        scheduledFor: new Date(now.getTime() + 14 * DAY_MS),
        idempotencyKey: `upsell:3:${salesCall.id}`,
      },
    ],
  });

  return inserted > 0 ? { started: true } : { started: false, reason: "no_jobs_inserted" };
}
