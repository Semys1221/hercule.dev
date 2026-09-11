/**
 * Prepare Meniaud (comptable) for not-paid dashboard preview — NO emails sent.
 *
 * - Copies Nahmias qualification if found, else Serial fallback (honorairesAnnuelsMin 2800)
 * - Sets sales_call status to not_paid without starting close-indecis jobs
 * - Prints rendered close_indecis_1 preview (HTML)
 *
 * Usage: pnpm prepare-meniaud-not-paid-preview
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildMeniaudSerialQualification } from "@/lib/admin/bookings/meniaud-serial-qualification";
import { mapQualificationToForm } from "@/lib/admin/onboarding/qualification-mapper";
import {
  createOnboardingClient,
  prefillComptableFormFromQualification,
} from "@/lib/admin/onboarding/supabase";
import { renderEmailFromStore } from "@/lib/booking-communication/template-store";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import {
  createSalesCallsClient,
  findSalesCallById,
  replaceSalesCallNotesSection,
  updateSalesCallStatus,
} from "@/lib/sales-calls/supabase";

const MENIAUD_SALES_CALL_ID = "8cfaee20-9a8c-4c5f-b84c-5868e639935b";
const MENIAUD_COMPTABLE_ID = "0f304fc7-ac3a-4cfb-a6a5-6a9da927f32b";
const NAHMIAS_EMAIL = "nahmias.gad@finasec.fr";

async function findNahmiasQualification(
  client: ReturnType<typeof createSalesCallsClient>,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client
    .from("sales_calls")
    .select("notes")
    .ilike("email", NAHMIAS_EMAIL)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Nahmias lookup failed: ${error.message}`);
  }

  const notes = (data?.notes ?? {}) as Record<string, unknown>;
  const qualification = notes.qualification;
  if (qualification && typeof qualification === "object" && Object.keys(qualification).length > 0) {
    return qualification as Record<string, unknown>;
  }
  return null;
}

async function main() {
  const salesClient = createSalesCallsClient();
  const linkClient = createLinkTrackingClient();
  const onboardingClient = createOnboardingClient();

  const salesCall = await findSalesCallById(salesClient, MENIAUD_SALES_CALL_ID);
  if (!salesCall) {
    throw new Error(`Sales call ${MENIAUD_SALES_CALL_ID} not found`);
  }

  const nahmiasQualification = await findNahmiasQualification(salesClient);
  const qualification = nahmiasQualification ?? buildMeniaudSerialQualification();
  const source = nahmiasQualification ? "nahmias" : "serial-fallback";

  console.log(`Qualification source: ${source}`);

  await replaceSalesCallNotesSection(
    salesClient,
    MENIAUD_SALES_CALL_ID,
    "qualification",
    qualification,
  );

  const formPatch = mapQualificationToForm(
    qualification as Parameters<typeof mapQualificationToForm>[0],
    "comptable",
  );
  await prefillComptableFormFromQualification(
    onboardingClient,
    MENIAUD_COMPTABLE_ID,
    formPatch,
  );

  if (salesCall.status !== "not_paid") {
    await updateSalesCallStatus(salesClient, MENIAUD_SALES_CALL_ID, "not_paid");
    console.log("Sales call status → not_paid (no close-indecis jobs inserted)");
  } else {
    console.log("Sales call already not_paid — status unchanged");
  }

  const lead = await findLeadById(linkClient, "comptable", MENIAUD_COMPTABLE_ID);
  if (!lead) {
    throw new Error(`Comptable lead ${MENIAUD_COMPTABLE_ID} not found`);
  }

  const dashboardLink = dashboardLinkFor(lead) ?? `https://www.hercule.dev/dashboard/${lead.slug}`;
  const rendered = await renderEmailFromStore({
    category: "comptable",
    emailType: "close_indecis_1",
    firstName: lead.first_name,
    scheduledAt: lead.scheduled_at,
    confirmUrl: dashboardLink,
    useHtml: true,
    dashboardLink,
    email: lead.email,
  });

  const outDir = resolve(process.cwd(), ".tmp");
  mkdirSync(outDir, { recursive: true });
  const htmlPath = resolve(outDir, "meniaud-close-indecis-1.html");
  writeFileSync(htmlPath, rendered.html ?? rendered.text, "utf8");

  console.log("\n--- Email 1 preview ---");
  console.log(`Subject: ${rendered.subject}`);
  console.log(`Dashboard: ${dashboardLink}`);
  console.log(`HTML saved: ${htmlPath}`);
  console.log("\nSTOP — no Resend jobs. Say « envoie » to trigger startCloseIndecisSequence.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
