import {
  createLinkTrackingClient,
  findLeadByCalendlyInviteeUri,
  findLeadByEmail,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

export type ResolvedBookingLead = {
  lead: LinkTrackingLead;
  category: LeadCategory;
};

export async function resolveBookingLead(params: {
  leadId?: string | null;
  email: string;
  inviteeUri: string;
}): Promise<ResolvedBookingLead | null> {
  const client = createLinkTrackingClient();

  if (params.leadId) {
    const byId = await findLeadById(client, "agence", params.leadId);
    if (byId) {
      return { lead: byId, category: "agence" };
    }
  }

  const byEmail = await findLeadByEmail(client, params.email);
  if (byEmail?.lead) {
    return { lead: byEmail.lead, category: byEmail.category };
  }

  const byInvitee = await findLeadByCalendlyInviteeUri(client, params.inviteeUri);
  if (byInvitee?.lead) {
    return { lead: byInvitee.lead, category: byInvitee.category };
  }

  return null;
}
