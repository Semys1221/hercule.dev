import type { SupabaseClient } from "@supabase/supabase-js";

import {
  COMMERCIAL_COMPTABLE,
  OFFER_TYPES_COMPTABLE,
} from "@/lib/commercial/constants";
import { CONFERENCE_CLIENT_TYPES } from "@/lib/commercial/conference-pricing";
import {
  DEC_FREE_TRIAL_RDV_TOTAL,
  PRODUCT_STATUT_FREE_TRIAL_PENDING,
} from "@/lib/clients/dec-free-trial";
import { firstLeadAtFrom } from "@/lib/clients/round-robin";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";

export type DecTrialClientDraft = {
  clientId: string;
  paymentId: string;
  slug: string;
};

/** Placeholder client + pending payment before Stripe embedded checkout (DEC 14-day trial). */
export async function createDecTrialClientDraft(
  client: SupabaseClient,
): Promise<DecTrialClientDraft> {
  const existingSlugs = await loadSlugSet(client);
  const [slug] = allocateSlugs(existingSlugs, 1);
  const offerType = OFFER_TYPES_COMPTABLE.monthly1499Trial;

  const { data: clientRow, error: clientInsertError } = await client
    .from("clients")
    .insert({
      email: `pending+${slug}@checkout.hercule.dev`,
      slug,
      client_type: CONFERENCE_CLIENT_TYPES.dec,
      secondary_vertical: null,
      billing: "monthly",
      offer_type: offerType,
      product_statut: PRODUCT_STATUT_FREE_TRIAL_PENDING,
      rdv_total: DEC_FREE_TRIAL_RDV_TOTAL,
      rdv_used: 0,
      first_lead_at: firstLeadAtFrom(new Date()),
    })
    .select("id")
    .single();

  if (clientInsertError || !clientRow) {
    throw new Error(clientInsertError?.message ?? "Failed to create client row");
  }

  const { data: paymentRow, error: paymentError } = await client
    .from("payments")
    .insert({
      client_id: clientRow.id,
      offer_type: offerType,
      amount_cents: COMMERCIAL_COMPTABLE.growthMonthlyPriceCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentError || !paymentRow) {
    await client.from("clients").delete().eq("id", clientRow.id);
    throw new Error(paymentError?.message ?? "Failed to create payment row");
  }

  return { clientId: clientRow.id, paymentId: paymentRow.id, slug };
}
