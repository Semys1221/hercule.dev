/**
 * Test: après paiement, dashboard Meniaud → comptable_onboarding (pas wizard).
 */
import assert from "node:assert/strict";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  createSalesCallsClient,
  findLatestSalesCallByComptableId,
} from "@/lib/sales-calls/supabase";
import { hasSucceededPaymentComptable } from "@/lib/dashboard/payments";

const MENIAUD_COMPTABLE_ID = "0f304fc7-ac3a-4cfb-a6a5-6a9da927f32b";
const SLUG = "ItSAm6";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://localhost:3000";

async function main() {
  const client = createLinkTrackingClient();
  const salesClient = createSalesCallsClient();

  const beforeRes = await fetch(`${BASE_URL}/api/dashboard/${SLUG}`);
  const before = (await beforeRes.json()) as { dashboardMode?: string };
  console.log("AVANT paiement simulé:", before.dashboardMode);

  const { data: pendingPayment } = await client
    .from("payments")
    .select("id, status")
    .eq("comptable_id", MENIAUD_COMPTABLE_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  assert.ok(pendingPayment, "payment row expected");

  const succeededAt = new Date().toISOString();
  const { error: payErr } = await client
    .from("payments")
    .update({
      status: "succeeded",
      succeeded_at: succeededAt,
      stripe_event_id: `test:meniaud-post-payment:${Date.now()}`,
    })
    .eq("id", pendingPayment.id);

  if (payErr) {
    throw new Error(payErr.message);
  }

  const { error: scErr } = await salesClient
    .from("sales_calls")
    .update({ status: "paid" })
    .eq("comptable_id", MENIAUD_COMPTABLE_ID)
    .in("status", ["scheduled", "not_paid", "completed", "no_show"]);

  if (scErr) {
    throw new Error(scErr.message);
  }

  const isPaid = await hasSucceededPaymentComptable(client, MENIAUD_COMPTABLE_ID);
  const salesCall = await findLatestSalesCallByComptableId(salesClient, MENIAUD_COMPTABLE_ID);

  const afterRes = await fetch(`${BASE_URL}/api/dashboard/${SLUG}`);
  const after = (await afterRes.json()) as {
    dashboardMode?: string;
    isPaid?: boolean;
    milestones?: Array<{ id: string; label: string }>;
  };

  console.log("APRÈS paiement simulé:", {
    dashboardMode: after.dashboardMode,
    isPaid: after.isPaid,
    salesCallStatus: salesCall?.status,
    dbIsPaid: isPaid,
    firstMilestone: after.milestones?.[0]?.label,
    firstRdvLabel: after.milestones?.find((m) => m.id === "first_rdv")?.label,
  });

  assert.equal(isPaid, true, "DB: payment succeeded");
  assert.equal(salesCall?.status, "paid", "sales_call → paid");
  assert.equal(
    after.dashboardMode,
    "comptable_onboarding",
    "dashboard doit être comptable_onboarding (onboarding button)",
  );
  assert.notEqual(
    after.dashboardMode,
    "comptable_not_paid",
    "ne doit plus être le wizard not_paid",
  );

  console.log("\n✅ Test OK — transition post-paiement vers onboarding");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
