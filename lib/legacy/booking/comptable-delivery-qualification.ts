import {
  routeSegmentMatchesLead,
} from "@/lib/clients/booking/resolve-comptable-delivery-reservation";
import type {
  FunnelAnswers,
  FunnelPhase,
  FunnelRouteSegment,
  FunnelStepId,
  QualificationRecord,
  QualificationUpsertPayload,
} from "@/lib/booking/comptable-delivery-funnel/schema";
import { qualificationUpsertSchema } from "@/lib/booking/comptable-delivery-funnel/schema";
import { isPreBookingComplete, isPostBookingComplete } from "@/lib/booking/comptable-delivery-funnel/navigation";
import { readComptableDeliverySegmentFromLead } from "@/lib/legacy/booking/reservation-surface";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/legacy/link-tracking/supabase";

export type QualificationRow = {
  id: string;
  comptable_delivery_id: string;
  slug: string;
  route_segment: string;
  phase: string;
  current_step_id: string;
  answers: Record<string, string>;
  pre_booking_completed_at: string | null;
  booked_at: string | null;
  post_booking_completed_at: string | null;
  updated_at: string;
};

function rowToRecord(row: QualificationRow): QualificationRecord {
  return {
    comptableDeliveryId: row.comptable_delivery_id,
    slug: row.slug,
    routeSegment: row.route_segment as FunnelRouteSegment,
    phase: row.phase as FunnelPhase,
    currentStepId: row.current_step_id as FunnelStepId,
    answers: row.answers ?? {},
    preBookingCompletedAt: row.pre_booking_completed_at,
    bookedAt: row.booked_at,
    postBookingCompletedAt: row.post_booking_completed_at,
    updatedAt: row.updated_at,
  };
}

export async function resolveQualificationLead(
  slug: string,
  routeSegment: FunnelRouteSegment,
) {
  const client = createLinkTrackingClient();
  const lookup = await findLeadByLink(client, slug.trim());
  if (!lookup || lookup.category !== "comptable_delivery") {
    return null;
  }
  const segmentStr = readComptableDeliverySegmentFromLead(lookup.lead);
  if (!routeSegmentMatchesLead(routeSegment, segmentStr)) {
    return null;
  }
  return { client, lookup };
}

export async function getQualificationBySlug(
  slug: string,
  routeSegment: FunnelRouteSegment,
): Promise<QualificationRecord | null> {
  const resolved = await resolveQualificationLead(slug, routeSegment);
  if (!resolved) return null;

  const { data, error } = await resolved.client
    .from("comptable_delivery_booking_qualification")
    .select("*")
    .eq("comptable_delivery_id", resolved.lookup.lead.id)
    .maybeSingle();

  if (error) {
    throw new Error(`getQualificationBySlug: ${error.message}`);
  }
  if (!data) return null;
  return rowToRecord(data as QualificationRow);
}

export async function upsertQualificationFromPayload(
  raw: QualificationUpsertPayload,
): Promise<QualificationRecord | null> {
  const payload = qualificationUpsertSchema.parse(raw);
  const resolved = await resolveQualificationLead(payload.slug, payload.routeSegment);
  if (!resolved) return null;

  const existing = await getQualificationBySlug(payload.slug, payload.routeSegment);
  const answers = payload.answers as FunnelAnswers;
  const preComplete = isPreBookingComplete(answers);
  const postComplete = isPostBookingComplete(answers);
  const now = new Date().toISOString();

  const patch = {
    comptable_delivery_id: resolved.lookup.lead.id,
    slug: payload.slug.trim(),
    route_segment: payload.routeSegment,
    phase: payload.phase,
    current_step_id: payload.currentStepId,
    answers: payload.answers,
    pre_booking_completed_at:
      payload.preBookingCompletedAt ??
      existing?.preBookingCompletedAt ??
      (preComplete ? now : null),
    booked_at: payload.bookedAt ?? existing?.bookedAt ?? null,
    post_booking_completed_at:
      payload.postBookingCompletedAt ??
      existing?.postBookingCompletedAt ??
      (postComplete && payload.currentStepId === "final_prep" ? now : null),
    updated_at: now,
  };

  const { data, error } = await resolved.client
    .from("comptable_delivery_booking_qualification")
    .upsert(patch, { onConflict: "comptable_delivery_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`upsertQualificationFromPayload: ${error.message}`);
  }
  return rowToRecord(data as QualificationRow);
}
