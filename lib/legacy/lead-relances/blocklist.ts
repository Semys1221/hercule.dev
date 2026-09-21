import { createAiReplyAgentClient } from "@/lib/legacy/ai-reply-agent/supabase";

export async function addReplyAgentBlocklistEntry(params: {
  campaignId: string;
  leadEmail: string;
  reason: string;
}): Promise<void> {
  const client = createAiReplyAgentClient();
  const { error } = await client.from("ai_reply_agent_blocklist").upsert(
    {
      campaign_id: params.campaignId,
      lead_email: params.leadEmail.trim().toLowerCase(),
      reason: params.reason,
      blocked_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id,lead_email" },
  );
  if (error) {
    throw new Error(`Failed to blocklist lead: ${error.message}`);
  }
}
