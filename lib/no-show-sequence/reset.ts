import { cancelPendingJobsForLead } from "@/lib/booking-communication/jobs";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import {
  createSalesCallsClient,
  updateSalesCallStatus,
} from "@/lib/sales-calls/supabase";
import type { SalesCall } from "@/lib/sales-calls/types";

const NO_SHOW_EMAIL_TYPES: BookingEmailType[] = [
  "no_show_indecis_1",
  "no_show_indecis_2",
  "no_show_indecis_3",
];

export type ResetNoShowResult =
  | { ok: true; status: "scheduled"; cancelledJobs: number }
  | { ok: false; reason: "not_no_show" | "paid" };

export async function resetNoShowForLead(
  salesCall: SalesCall,
  leadId: string,
): Promise<ResetNoShowResult> {
  if (salesCall.status === "paid") {
    return { ok: false, reason: "paid" };
  }
  if (salesCall.status !== "no_show") {
    return { ok: false, reason: "not_no_show" };
  }

  const client = createSalesCallsClient();
  await updateSalesCallStatus(client, salesCall.id, "scheduled");
  const cancelledJobs = await cancelPendingJobsForLead(leadId, NO_SHOW_EMAIL_TYPES);

  return { ok: true, status: "scheduled", cancelledJobs };
}
