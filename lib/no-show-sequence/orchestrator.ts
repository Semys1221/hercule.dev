import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import { scheduleLeadEmailJobs } from "@/lib/booking-communication/product-send";
import type { SalesCall } from "@/lib/sales-calls/types";

const HOUR_MS = 60 * 60 * 1000;

export async function startNoShowSequence(
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
    triggeredBy: "sales_call_no_show",
    jobs: [
      {
        emailType: "no_show_indecis_1",
        scheduledFor: now,
        idempotencyKey: `no-show:1:${salesCall.id}`,
      },
      {
        emailType: "no_show_indecis_2",
        scheduledFor: new Date(now.getTime() + 24 * HOUR_MS),
        idempotencyKey: `no-show:2:${salesCall.id}`,
      },
      {
        emailType: "no_show_indecis_3",
        scheduledFor: new Date(now.getTime() + 48 * HOUR_MS),
        idempotencyKey: `no-show:3:${salesCall.id}`,
      },
    ],
  });

  return inserted > 0 ? { started: true } : { started: false, reason: "no_jobs_inserted" };
}
