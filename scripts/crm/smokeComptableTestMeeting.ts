/**
 * Smoke: comptable test-session seed writes to `comptable`, not `entreprise`.
 *
 * Usage:
 *   pnpm smoke-comptable-test-meeting
 */
import { provisionTestMeeting } from "@/lib/admin/funnels/provision-test-meeting";
import { SALES_TEST_SESSION_COMPTABLE_SLUG } from "@/lib/admin/funnels/sales-test-session-preset";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

async function main(): Promise<void> {
  const client = createLinkTrackingClient();

  await provisionTestMeeting(client, "comptable");

  const { data: comptableRow, error: comptableError } = await client
    .from("comptable")
    .select("id, slug, email")
    .eq("slug", SALES_TEST_SESSION_COMPTABLE_SLUG)
    .maybeSingle();

  if (comptableError) {
    throw new Error(`comptable lookup failed: ${comptableError.message}`);
  }
  if (!comptableRow) {
    throw new Error(`expected comptable row for slug ${SALES_TEST_SESSION_COMPTABLE_SLUG}`);
  }

  const { data: entrepriseRow, error: entrepriseError } = await client
    .from("entreprise")
    .select("id")
    .eq("slug", SALES_TEST_SESSION_COMPTABLE_SLUG)
    .maybeSingle();

  if (entrepriseError) {
    throw new Error(`entreprise lookup failed: ${entrepriseError.message}`);
  }
  if (entrepriseRow) {
    throw new Error(
      `entreprise row must not exist for comptable test slug ${SALES_TEST_SESSION_COMPTABLE_SLUG}`,
    );
  }

  const { data: salesCall, error: salesCallError } = await client
    .from("sales_calls")
    .select("id, comptable_id, entreprise_id, agence_id")
    .eq("comptable_id", comptableRow.id)
    .maybeSingle();

  if (salesCallError) {
    throw new Error(`sales_calls lookup failed: ${salesCallError.message}`);
  }
  if (!salesCall?.comptable_id) {
    throw new Error("expected sales_calls.comptable_id for comptable test seed");
  }
  if (salesCall.entreprise_id || salesCall.agence_id) {
    throw new Error("sales_calls owner FK must be comptable_id only");
  }

  console.log(
    `OK comptable test meeting: comptable.id=${comptableRow.id} sales_call=${salesCall.id}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
