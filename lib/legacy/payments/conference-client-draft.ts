import type { SupabaseClient } from "@supabase/supabase-js";

import { firstLeadAtFrom } from "@/lib/clients/round-robin";
import {
  rdvCountForOffer,
  type ConferenceBilling,
  type ConferenceClientType,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import { amountCentsForConferenceOffer } from "@/lib/legacy/payments/conference-offers";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";

export type ConferenceClientDraft = {
  clientId: string;
  paymentId: string;
  slug: string;
};

/** Inserts a placeholder client + pending payment before (or right after) Stripe checkout. */
export async function createConferenceClientDraft(
  client: SupabaseClient,
  input: {
    clientType: ConferenceClientType;
    billing: ConferenceBilling;
    offerType: ConferenceOfferType;
    secondaryVertical: "ias" | null;
    stripeCheckoutSessionId?: string;
  },
): Promise<ConferenceClientDraft> {
  const existingSlugs = await loadSlugSet(client);
  const [slug] = allocateSlugs(existingSlugs, 1);

  const { data: clientRow, error: clientInsertError } = await client
    .from("clients")
    .insert({
      email: `pending+${slug}@checkout.hercule.dev`,
      slug,
      client_type: input.clientType,
      secondary_vertical: input.secondaryVertical,
      billing: input.billing,
      offer_type: input.offerType,
      rdv_total: rdvCountForOffer(input.offerType),
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
      offer_type: input.offerType,
      amount_cents: amountCentsForConferenceOffer(input.offerType),
      status: "pending",
      ...(input.stripeCheckoutSessionId
        ? { stripe_checkout_session_id: input.stripeCheckoutSessionId }
        : {}),
    })
    .select("id")
    .single();

  if (paymentError || !paymentRow) {
    await client.from("clients").delete().eq("id", clientRow.id);
    throw new Error(paymentError?.message ?? "Failed to create payment row");
  }

  return { clientId: clientRow.id, paymentId: paymentRow.id, slug };
}
