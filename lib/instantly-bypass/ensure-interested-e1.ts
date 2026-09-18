import { handleLeadInterested } from "./handler";

import type { HandleInterestedResult } from "./types";

/**
 * Send E1 when a lead is Interested but the bypass event is missing.
 * Skips reply-agent reprocess — the caller handles the current inbound reply.
 */
export async function ensureInterestedE1IfMissing(params: {
  campaignId: string;
  leadEmail: string;
  emailAccount?: string;
  firstName?: string;
}): Promise<HandleInterestedResult> {
  return handleLeadInterested(
    {
      timestamp: new Date().toISOString(),
      event_type: "lead_interested",
      campaign_id: params.campaignId,
      lead_email: params.leadEmail,
      email_account: params.emailAccount,
      first_name: params.firstName,
    },
    { skipReplyReprocess: true },
  );
}
