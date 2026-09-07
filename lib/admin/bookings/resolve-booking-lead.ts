import {
  createLinkTrackingClient,
  findLeadByCalendlyInviteeUri,
  findLeadByEmail,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

export async function resolveBookingLead(params: {
  leadId?: string | null;
  email: string;
  inviteeUri: string;
}): Promise<LinkTrackingLead | null> {
  const client = createLinkTrackingClient();

  if (params.leadId) {
    const byId = await findLeadById(client, "agence", params.leadId);
    if (byId) {
      return byId;
    }
  }

  const byEmail = await findLeadByEmail(client, params.email);
  if (byEmail?.lead) {
    return byEmail.lead;
  }

  const byInvitee = await findLeadByCalendlyInviteeUri(client, params.inviteeUri);
  return byInvitee?.lead ?? null;
}
