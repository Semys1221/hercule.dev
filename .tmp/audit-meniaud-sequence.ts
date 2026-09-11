import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { createSalesCallsClient, findSalesCallById } from "@/lib/sales-calls/supabase";

const MENIAUD_COMPTABLE_ID = "0f304fc7-ac3a-4cfb-a6a5-6a9da927f32b";
const MENIAUD_SALES_CALL_ID = "8cfaee20-9a8c-4c5f-b84c-5868e639935b";

async function main() {
  const client = createLinkTrackingClient();
  const salesClient = createSalesCallsClient();

  const salesCall = await findSalesCallById(salesClient, MENIAUD_SALES_CALL_ID);

  const { data: jobs, error } = await client
    .from("booking_email_jobs")
    .select(
      "id,email_type,status,scheduled_for,sent_at,error_message,idempotency_key,use_html,lead_category,resend_message_id",
    )
    .eq("lead_id", MENIAUD_COMPTABLE_ID)
    .like("email_type", "close_indecis%")
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data: lead } = await client
    .from("comptable")
    .select("email,first_name,slug")
    .eq("id", MENIAUD_COMPTABLE_ID)
    .single();

  console.log(
    JSON.stringify(
      {
        lead: lead ?? null,
        salesCall: salesCall
          ? { id: salesCall.id, status: salesCall.status, email: salesCall.email }
          : null,
        closeIndecisJobs: jobs ?? [],
        summary: {
          total: jobs?.length ?? 0,
          sent: jobs?.filter((j) => j.status === "sent").length ?? 0,
          pending: jobs?.filter((j) => j.status === "pending").length ?? 0,
          failed: jobs?.filter((j) => j.status === "failed").length ?? 0,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
