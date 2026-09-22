/**
 * Move Meniaud (comptable) into public.clients — NO emails sent.
 *
 * - Inserts DEC monthly conference client row
 * - Archives comptable lead (statut CANCELLED)
 * - Does not trigger onboarding, close-indecis, or Calendly seat flows
 *
 * Usage: pnpm move-meniaud-to-client
 */

import { firstLeadAtFrom } from "@/lib/clients/round-robin";
import { findClientByEmail } from "@/lib/clients/appointments/find-host";
import { rdvCountForOffer } from "@/lib/commercial/conference-pricing";
import {
  allocateSlugs,
  loadSlugSet,
} from "@/lib/legacy/link-tracking/slug";
import {
  createLinkTrackingClient,
  findLeadById,
} from "@/lib/legacy/link-tracking/supabase";

const MENIAUD_COMPTABLE_ID = "0f304fc7-ac3a-4cfb-a6a5-6a9da927f32b";
const OFFER_TYPE = "conference_dec_monthly";

async function main() {
  const client = createLinkTrackingClient();

  const lead = await findLeadById(client, "comptable", MENIAUD_COMPTABLE_ID);
  if (!lead) {
    throw new Error(`Comptable lead ${MENIAUD_COMPTABLE_ID} not found`);
  }

  const email = lead.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Meniaud comptable row has no email");
  }

  const existingClient = await findClientByEmail(email, client);
  if (existingClient) {
    throw new Error(
      `Client already exists for ${email} (id=${existingClient.id}) — aborting`,
    );
  }

  const existingSlugs = await loadSlugSet(client);
  const [slug] = allocateSlugs(existingSlugs, 1);

  const baseInsert = {
    email,
    slug,
    first_name: lead.first_name,
    client_type: "dec",
    billing: "monthly",
    offer_type: OFFER_TYPE,
    rdv_total: rdvCountForOffer(OFFER_TYPE),
    rdv_used: 0,
    product_statut: "NONE",
  };

  let inserted: { id: string; slug: string; email: string } | null = null;
  let insertError: { message: string } | null = null;

  const withFirstLeadAt = {
    ...baseInsert,
    first_lead_at: firstLeadAtFrom(new Date()),
  };
  const firstAttempt = await client
    .from("clients")
    .insert(withFirstLeadAt)
    .select("id, slug, email")
    .single();

  if (firstAttempt.error?.message.includes("first_lead_at")) {
    const fallbackAttempt = await client
      .from("clients")
      .insert(baseInsert)
      .select("id, slug, email")
      .single();
    inserted = fallbackAttempt.data;
    insertError = fallbackAttempt.error;
  } else {
    inserted = firstAttempt.data;
    insertError = firstAttempt.error;
  }

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to insert client row");
  }

  const { error: archiveError } = await client
    .from("comptable")
    .update({ statut: "CANCELLED" })
    .eq("id", MENIAUD_COMPTABLE_ID);

  if (archiveError) {
    throw new Error(`Failed to archive comptable lead: ${archiveError.message}`);
  }

  console.log("Meniaud moved to public.clients:");
  console.log(`  client_id: ${inserted.id}`);
  console.log(`  slug: ${inserted.slug}`);
  console.log(`  email: ${inserted.email}`);
  console.log(`  offer: ${OFFER_TYPE}`);
  console.log(`  comptable ${MENIAUD_COMPTABLE_ID} → statut CANCELLED`);
  console.log("\nNo emails sent. Reply agent will skip this email.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
