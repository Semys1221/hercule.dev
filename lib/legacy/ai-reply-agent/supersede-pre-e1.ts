import { createAiReplyAgentClient } from "./supabase";

const SUPERSEDABLE_STATUSES = [
  "pending",
  "skipped_waiting_e1",
  "skipped_collision",
  "skipped_unsafe",
  "skipped_recovery",
  "failed",
] as const;

const SUPERSEDE_REASON =
  "Réponse de qualification avant E1 — interested_email1 est la réponse";

/** Mark pre-E1 inbounds terminal once E1 is dispatched. */
export async function supersedePreE1Inbounds(params: {
  campaignId: string;
  leadEmail: string;
  e1DispatchedAt: string;
}): Promise<number> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .update({
      ai_status: "superseded_by_e1",
      ai_reason: SUPERSEDE_REASON,
    })
    .eq("campaign_id", params.campaignId)
    .eq("lead_email", params.leadEmail.trim().toLowerCase())
    .eq("direction", "inbound")
    .in("ai_status", [...SUPERSEDABLE_STATUSES])
    .lte("created_at", params.e1DispatchedAt)
    .select("id");

  if (error) {
    throw new Error(`Failed to supersede pre-E1 inbounds: ${error.message}`);
  }
  return data?.length ?? 0;
}
