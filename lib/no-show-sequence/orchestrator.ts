import type { SalesCallSequenceResult } from "@/lib/admin/bookings/sales-call-sequence";
import { insertJob } from "@/lib/booking-communication/jobs";
import { dispatchDueJobsForLead } from "@/lib/booking-communication/orchestrator";
import type { LeadCategory } from "@/lib/link-tracking/types";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { SalesCall } from "@/lib/sales-calls/types";

const HOUR_MS = 60 * 60 * 1000;

export async function startNoShowSequence(
  salesCall: SalesCall,
  leadId: string,
  category: LeadCategory = "agence",
): Promise<SalesCallSequenceResult> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, category, leadId);
  if (!lead) {
    return { started: false, reason: "lead_not_found", dispatched: false };
  }

  const now = new Date();
  const jobs = [
    {
      emailType: "no_show_indecis_1" as const,
      scheduledFor: now,
      idempotencyKey: `no-show:1:${salesCall.id}`,
    },
    {
      emailType: "no_show_indecis_2" as const,
      scheduledFor: new Date(now.getTime() + 24 * HOUR_MS),
      idempotencyKey: `no-show:2:${salesCall.id}`,
    },
    {
      emailType: "no_show_indecis_3" as const,
      scheduledFor: new Date(now.getTime() + 48 * HOUR_MS),
      idempotencyKey: `no-show:3:${salesCall.id}`,
    },
  ];

  let inserted = 0;
  for (const job of jobs) {
    const row = await insertJob({
      category,
      leadId: lead.id,
      emailType: job.emailType,
      scheduledFor: job.scheduledFor,
      triggeredBy: "sales_call_no_show",
      idempotencyKey: job.idempotencyKey,
    });
    if (row) {
      inserted += 1;
    }
  }

  await dispatchDueJobsForLead(lead.id);

  if (inserted > 0) {
    return { started: true, dispatched: true };
  }

  return { started: true, reason: "jobs_already_scheduled", dispatched: true };
}
