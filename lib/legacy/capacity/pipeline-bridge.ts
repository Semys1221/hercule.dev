/**
 * Bridge SaaS capacity ↔ existing link-tracking / booking pipeline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { markAssignmentBooked } from "@/lib/legacy/capacity/supabase";
import { normalizeEmail } from "@/lib/legacy/link-tracking/supabase";

/**
 * When a prospect books (Calendly), mark the matching lead_assignment as booked
 * and increment the client slot RDV counter.
 */
export async function syncSaasAssignmentOnBooking(params: {
  client: SupabaseClient;
  email: string;
  slug?: string | null;
}): Promise<{ synced: boolean; assignmentId?: string }> {
  const email = normalizeEmail(params.email);
  if (!email) return { synced: false };

  // Find prospect in pool
  const { data: prospect } = await params.client
    .from("prospect_pool")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!prospect) {
    // Fallback: find assignment by link_tracking_slug
    if (params.slug) {
      const { data: bySlug } = await params.client
        .from("lead_assignments")
        .select("id, client_slot_id, sequence_state")
        .eq("link_tracking_slug", params.slug)
        .not("sequence_state", "eq", "booked")
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (bySlug) {
        await markAssignmentBooked({
          client: params.client,
          assignmentId: bySlug.id,
          slotId: bySlug.client_slot_id,
        });
        return { synced: true, assignmentId: bySlug.id };
      }
    }
    return { synced: false };
  }

  const { data: assignment } = await params.client
    .from("lead_assignments")
    .select("id, client_slot_id, sequence_state")
    .eq("prospect_id", prospect.id)
    .not("sequence_state", "eq", "booked")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assignment) return { synced: false };

  await markAssignmentBooked({
    client: params.client,
    assignmentId: assignment.id,
    slotId: assignment.client_slot_id,
  });

  await params.client
    .from("prospect_pool")
    .update({ status: "booked" })
    .eq("id", prospect.id);

  return { synced: true, assignmentId: assignment.id };
}

/**
 * Resolve Instantly campaign → client_outreach_slot for reply agent CTA / routing.
 */
export async function resolveSlotByCampaignId(
  client: SupabaseClient,
  campaignId: string,
): Promise<{
  slotId: string;
  agenceId: string;
  calendlySchedulingUrl: string | null;
} | null> {
  const id = campaignId.trim();
  if (!id) return null;
  const { data } = await client
    .from("client_outreach_slots")
    .select("id, agence_id, calendly_scheduling_url")
    .eq("instantly_campaign_id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    slotId: data.id,
    agenceId: data.agence_id,
    calendlySchedulingUrl: data.calendly_scheduling_url,
  };
}
