import { createAiReplyAgentClient } from "./supabase";

/** True when an outbound auto-reply already exists for this inbound window. */
export async function hasOutboundSinceInbound(params: {
  campaignId: string;
  leadEmail: string;
  inboundCreatedAt: string | null;
}): Promise<boolean> {
  const client = createAiReplyAgentClient();
  let query = client
    .from("ai_reply_agent_messages")
    .select("id")
    .eq("campaign_id", params.campaignId)
    .eq("lead_email", params.leadEmail.trim().toLowerCase())
    .eq("direction", "outbound")
    .limit(1);

  if (params.inboundCreatedAt) {
    query = query.gte("created_at", params.inboundCreatedAt);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to check outbound mutex: ${error.message}`);
  }
  return (data?.length ?? 0) > 0;
}
