/**
 * Smoke: entreprise test-session seed writes to `entreprise`, not `agence`.
 *
 * Usage:
 *   pnpm tsx --env-file=.env ./scripts/crm/smokeEntrepriseTestMeeting.ts
 */
import { provisionTestMeeting } from "@/lib/admin/funnels/provision-test-meeting";
import { SALES_TEST_SESSION_ENTREPRISE_SLUG } from "@/lib/admin/funnels/sales-test-session-preset";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

async function main(): Promise<void> {
  const client = createLinkTrackingClient();

  await provisionTestMeeting(client, "entreprise");

  const { data: entrepriseRow, error: entrepriseError } = await client
    .from("entreprise")
    .select("id, slug, email")
    .eq("slug", SALES_TEST_SESSION_ENTREPRISE_SLUG)
    .maybeSingle();

  if (entrepriseError) {
    throw new Error(`entreprise lookup failed: ${entrepriseError.message}`);
  }
  if (!entrepriseRow) {
    throw new Error(`expected entreprise row for slug ${SALES_TEST_SESSION_ENTREPRISE_SLUG}`);
  }

  const { data: agenceRow, error: agenceError } = await client
    .from("agence")
    .select("id")
    .eq("slug", SALES_TEST_SESSION_ENTREPRISE_SLUG)
    .maybeSingle();

  if (agenceError) {
    throw new Error(`agence lookup failed: ${agenceError.message}`);
  }
  if (agenceRow) {
    throw new Error(
      `agence row must not exist for entreprise test slug ${SALES_TEST_SESSION_ENTREPRISE_SLUG}`,
    );
  }

  const { data: salesCall, error: salesCallError } = await client
    .from("sales_calls")
    .select("id, comptable_id, entreprise_id, agence_id")
    .eq("entreprise_id", entrepriseRow.id)
    .maybeSingle();

  if (salesCallError) {
    throw new Error(`sales_calls lookup failed: ${salesCallError.message}`);
  }
  if (!salesCall?.entreprise_id) {
    throw new Error("expected sales_calls.entreprise_id for entreprise test seed");
  }
  if (salesCall.comptable_id || salesCall.agence_id) {
    throw new Error("sales_calls owner FK must be entreprise_id only");
  }

  console.log(
    `OK entreprise test meeting: entreprise.id=${entrepriseRow.id} sales_call=${salesCall.id}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
