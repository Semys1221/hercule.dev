/**
 * lib/product/transitions.ts — Single server module for all product_statut writes.
 *
 * Decisions: ENG-06, FND-01, FND-04, FND-07, FND-08, ORCH-03.
 *
 * RULES:
 * - All product_statut mutations must call a function from this module.
 * - React components and Client Components must never call these directly.
 * - Each function validates the current state before writing.
 * - Side effects (emails, related table writes) are fired inside the function.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { COMMERCIAL } from "@/lib/commercial/constants";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { ProductStatut } from "@/lib/admin/clients/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Add N working days (Mon–Fri) to a reference date. */
function addWorkingDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      added++;
    }
  }
  return result;
}

async function getProductStatut(
  client: SupabaseClient,
  table: LeadCategory,
  id: string,
): Promise<ProductStatut | null> {
  const { data } = await client
    .from(table)
    .select("product_statut")
    .eq("id", id)
    .maybeSingle();
  return (data?.product_statut as ProductStatut) ?? null;
}

function guardTransition(
  current: ProductStatut | null,
  allowed: ProductStatut[],
  to: ProductStatut,
): void {
  if (!current || !allowed.includes(current)) {
    throw new Error(
      `transition_blocked: cannot move to ${to} from ${current ?? "null"} (allowed: ${allowed.join(", ")})`,
    );
  }
}

// ---------------------------------------------------------------------------
// NONE → ONBOARDED
// Trigger: onboarding form submitted (client or ops)
// ---------------------------------------------------------------------------
export async function transitionToOnboarded(
  client: SupabaseClient,
  leadId: string,
  category: LeadCategory,
): Promise<void> {
  const current = await getProductStatut(client, category, leadId);
  guardTransition(current, ["NONE"], "ONBOARDED");

  const { error } = await client
    .from(category)
    .update({
      product_statut: "ONBOARDED" satisfies ProductStatut,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) throw new Error(`transitionToOnboarded: ${error.message}`);
}

// ---------------------------------------------------------------------------
// ONBOARDED | PAID_PENDING_ONBOARDING → IN_DELIVERANCE
// Trigger: payments.succeeded (auto, via Stripe webhook) OR ops override
// Side effects: sets deliverance_started_at, estimated_completion_at
// ---------------------------------------------------------------------------
export async function transitionToInDeliverance(
  client: SupabaseClient,
  leadId: string,
  category: LeadCategory,
): Promise<void> {
  const current = await getProductStatut(client, category, leadId);
  guardTransition(
    current,
    ["ONBOARDED", "PAID_PENDING_ONBOARDING", "SOLD", "MATCH_PROPOSED", "POST_RDV_SURVEY"],
    "IN_DELIVERANCE",
  );

  const now = new Date();
  const estimatedAt = addWorkingDays(now, COMMERCIAL.firstHonoredDaysStandard);

  const patch: Record<string, unknown> = {
    product_statut: "IN_DELIVERANCE" satisfies ProductStatut,
  };

  // Only set deliverance dates on the first transition to IN_DELIVERANCE
  if (current === "ONBOARDED" || current === "PAID_PENDING_ONBOARDING") {
    patch.deliverance_started_at = now.toISOString();
    patch.estimated_completion_at = estimatedAt.toISOString();
  }

  const { error } = await client.from(category).update(patch).eq("id", leadId);
  if (error) throw new Error(`transitionToInDeliverance: ${error.message}`);
}

// ---------------------------------------------------------------------------
// IN_DELIVERANCE → MATCH_PROPOSED (agence) + MATCH_PROPOSED (entreprise)
// Trigger: ops "Mettre en lien"
// Side effects: must be followed by matches INSERT in the calling route
// ---------------------------------------------------------------------------
export async function transitionToMatchProposed(
  client: SupabaseClient,
  agenceId: string,
  entrepriseId: string,
): Promise<void> {
  const agenceCurrent = await getProductStatut(client, "agence", agenceId);
  guardTransition(agenceCurrent, ["IN_DELIVERANCE"], "MATCH_PROPOSED");

  const { error: errA } = await client
    .from("agence")
    .update({ product_statut: "MATCH_PROPOSED" satisfies ProductStatut })
    .eq("id", agenceId);
  if (errA) throw new Error(`transitionToMatchProposed (agence): ${errA.message}`);

  const { error: errE } = await client
    .from("entreprise")
    .update({ product_statut: "MATCH_PROPOSED" satisfies ProductStatut })
    .eq("id", entrepriseId);
  if (errE) throw new Error(`transitionToMatchProposed (entreprise): ${errE.message}`);
}

// ---------------------------------------------------------------------------
// MATCH_PROPOSED → MEETING_BOOKED (both agence and entreprise)
// Trigger: Calendly delivery webhook invitee.created
// Side effects: appointments INSERT + active_match_id set (done by calling route)
// ---------------------------------------------------------------------------
export async function transitionToMeetingBooked(
  client: SupabaseClient,
  agenceId: string,
  entrepriseId: string,
): Promise<void> {
  const agenceCurrent = await getProductStatut(client, "agence", agenceId);
  guardTransition(agenceCurrent, ["MATCH_PROPOSED"], "MEETING_BOOKED");

  const { error: errA } = await client
    .from("agence")
    .update({ product_statut: "MEETING_BOOKED" satisfies ProductStatut })
    .eq("id", agenceId);
  if (errA) throw new Error(`transitionToMeetingBooked (agence): ${errA.message}`);

  const { error: errE } = await client
    .from("entreprise")
    .update({ product_statut: "MEETING_BOOKED" satisfies ProductStatut })
    .eq("id", entrepriseId);
  if (errE) throw new Error(`transitionToMeetingBooked (entreprise): ${errE.message}`);
}

// ---------------------------------------------------------------------------
// MEETING_BOOKED → POST_RDV_SURVEY (agence)
// Trigger: ops marks RDV completed
// ---------------------------------------------------------------------------
export async function transitionToPostRdvSurvey(
  client: SupabaseClient,
  agenceId: string,
): Promise<void> {
  const current = await getProductStatut(client, "agence", agenceId);
  guardTransition(current, ["MEETING_BOOKED"], "POST_RDV_SURVEY");

  const { error } = await client
    .from("agence")
    .update({ product_statut: "POST_RDV_SURVEY" satisfies ProductStatut })
    .eq("id", agenceId);
  if (error) throw new Error(`transitionToPostRdvSurvey: ${error.message}`);
}

// ---------------------------------------------------------------------------
// POST_RDV_SURVEY → IN_DELIVERANCE (agence) — after survey "oui" (SOLD)
// Side effects: closes match (matches.outcome handled by caller), clears active_match_id
// ---------------------------------------------------------------------------
export async function transitionToSold(
  client: SupabaseClient,
  matchId: string,
  agenceId: string,
): Promise<void> {
  const current = await getProductStatut(client, "agence", agenceId);
  guardTransition(current, ["POST_RDV_SURVEY"], "IN_DELIVERANCE");

  // Agence goes back to IN_DELIVERANCE (pack continues — BIZ-06)
  const { error: errA } = await client
    .from("agence")
    .update({
      product_statut: "IN_DELIVERANCE" satisfies ProductStatut,
      active_match_id: null,
    })
    .eq("id", agenceId);
  if (errA) throw new Error(`transitionToSold (agence): ${errA.message}`);

  // Close the match with outcome "sold"
  const { error: errM } = await client
    .from("matches")
    .update({
      status: "sold",
      sale_made: true,
    })
    .eq("id", matchId);
  if (errM) throw new Error(`transitionToSold (match): ${errM.message}`);
}

// ---------------------------------------------------------------------------
// POST_RDV_SURVEY → IN_DELIVERANCE (agence) — survey "non, continue"
// ---------------------------------------------------------------------------
export async function transitionToNoContinue(
  client: SupabaseClient,
  matchId: string,
  agenceId: string,
): Promise<void> {
  const current = await getProductStatut(client, "agence", agenceId);
  guardTransition(current, ["POST_RDV_SURVEY"], "IN_DELIVERANCE");

  const { error: errA } = await client
    .from("agence")
    .update({
      product_statut: "IN_DELIVERANCE" satisfies ProductStatut,
      active_match_id: null,
    })
    .eq("id", agenceId);
  if (errA) throw new Error(`transitionToNoContinue (agence): ${errA.message}`);

  const { error: errM } = await client
    .from("matches")
    .update({ status: "sold", sale_made: false })
    .eq("id", matchId);
  if (errM) throw new Error(`transitionToNoContinue (match): ${errM.message}`);
}

// ---------------------------------------------------------------------------
// MEETING_BOOKED → IN_DELIVERANCE — no-show entreprise (recrédit)
// Side effects: credits_remaining +1 if pack_989x3
// ---------------------------------------------------------------------------
export async function transitionFromNoshowToInDeliverance(
  client: SupabaseClient,
  agenceId: string,
  entrepriseId: string,
  offerType: string | null,
): Promise<void> {
  const agenceCurrent = await getProductStatut(client, "agence", agenceId);
  guardTransition(agenceCurrent, ["MEETING_BOOKED"], "IN_DELIVERANCE");

  // Recrédit if pack
  const patch: Record<string, unknown> = {
    product_statut: "IN_DELIVERANCE" satisfies ProductStatut,
    active_match_id: null,
  };
  if (offerType === "pack_989x3") {
    const { data } = await client
      .from("agence")
      .select("credits_remaining")
      .eq("id", agenceId)
      .single();
    if (typeof data?.credits_remaining === "number") {
      patch.credits_remaining = data.credits_remaining + 1;
    }
  }

  const { error: errA } = await client.from("agence").update(patch).eq("id", agenceId);
  if (errA) throw new Error(`transitionFromNoshowToInDeliverance (agence): ${errA.message}`);

  const { error: errE } = await client
    .from("entreprise")
    .update({ product_statut: "MATCH_PROPOSED" satisfies ProductStatut })
    .eq("id", entrepriseId);
  if (errE) throw new Error(`transitionFromNoshowToInDeliverance (entreprise): ${errE.message}`);
}

// ---------------------------------------------------------------------------
// any → ARCHIVED — entreprise refuses to continue (FND-08)
// ---------------------------------------------------------------------------
export async function transitionToArchived(
  client: SupabaseClient,
  entrepriseId: string,
): Promise<void> {
  const { error } = await client
    .from("entreprise")
    .update({ product_statut: "ARCHIVED" satisfies ProductStatut })
    .eq("id", entrepriseId);
  if (error) throw new Error(`transitionToArchived: ${error.message}`);
}

// ---------------------------------------------------------------------------
// any → CANCELLED — ops resigns account (BIZ-10)
// ---------------------------------------------------------------------------
export async function transitionToCancelled(
  client: SupabaseClient,
  agenceId: string,
): Promise<void> {
  const { error } = await client
    .from("agence")
    .update({ product_statut: "CANCELLED" satisfies ProductStatut })
    .eq("id", agenceId);
  if (error) throw new Error(`transitionToCancelled: ${error.message}`);
}
