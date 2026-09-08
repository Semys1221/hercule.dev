import {
  createLinkTrackingClient,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/link-tracking/slug";
import type { LeadCategory, LeadLookup, LinkTrackingLead } from "@/lib/link-tracking/types";

export async function persistLeadBookingContext(
  lookup: LeadLookup,
  patch: {
    slug?: string;
    calendlyInviteeUri?: string | null;
    calendlyPayload?: Record<string, unknown> | null;
    scheduledAt?: string | null;
  },
): Promise<LinkTrackingLead> {
  const client = createLinkTrackingClient();
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.slug?.trim()) {
    row.slug = patch.slug.trim();
  }
  if (patch.calendlyInviteeUri?.trim()) {
    row.calendly_invitee_uri = patch.calendlyInviteeUri.trim();
  }
  if (patch.calendlyPayload) {
    row.calendly_payload = patch.calendlyPayload;
  }
  if (patch.scheduledAt) {
    row.scheduled_at = patch.scheduledAt;
  }

  const { data, error } = await client
    .from(lookup.category)
    .update(row)
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Failed to persist booking context: ${error?.message ?? "no row"}`,
    );
  }
  return data as LinkTrackingLead;
}

export async function ensureLeadSlug(
  lookup: LeadLookup,
  preferredSlug?: string | null,
): Promise<LinkTrackingLead> {
  const existingSlug = lookup.lead.slug?.trim() ?? "";
  if (existingSlug) {
    return lookup.lead;
  }

  const client = createLinkTrackingClient();
  const taken = await loadSlugSet(client);
  const preferred = preferredSlug?.trim() ?? "";
  const slug =
    preferred && !taken.has(preferred) ? preferred : allocateSlugs(taken, 1)[0]!;

  return persistLeadBookingContext(lookup, { slug });
}

export async function loadLeadLookup(
  category: LeadCategory,
  leadId: string,
): Promise<LeadLookup | null> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, category, leadId);
  if (!lead) {
    return null;
  }
  return { category, lead };
}

export function calendlyPayloadFromEventUri(
  eventUri: string,
): Record<string, unknown> {
  return {
    scheduled_event: { uri: eventUri },
  };
}
