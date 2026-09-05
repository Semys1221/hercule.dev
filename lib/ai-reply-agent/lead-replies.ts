import { createAiReplyAgentClient } from "./supabase";

function normalizeLeadEmail(leadEmail: string): string {
  return leadEmail.trim().toLowerCase();
}

export async function getLeadReply(
  campaignId: string,
  leadEmail: string,
): Promise<string | null> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_leads")
    .select("ai_reply_agent_1")
    .eq("campaign_id", campaignId)
    .eq("lead_email", normalizeLeadEmail(leadEmail))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ai_reply_agent_leads: ${error.message}`);
  }

  const text = data?.ai_reply_agent_1;
  if (typeof text !== "string" || !text.trim()) {
    return null;
  }
  return text.trim();
}

export async function upsertLeadReply(
  campaignId: string,
  leadEmail: string,
  replyText: string,
): Promise<void> {
  const client = createAiReplyAgentClient();
  const normalizedEmail = normalizeLeadEmail(leadEmail);
  const trimmed = replyText.trim();
  if (!trimmed) {
    throw new Error("replyText must be non-empty");
  }

  const { error } = await client.from("ai_reply_agent_leads").upsert(
    {
      campaign_id: campaignId,
      lead_email: normalizedEmail,
      ai_reply_agent_1: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id,lead_email" },
  );

  if (error) {
    throw new Error(`Failed to upsert ai_reply_agent_leads: ${error.message}`);
  }
}

export async function getLeadRepliesBatch(
  campaignId: string,
  leadEmails: string[],
): Promise<Record<string, string>> {
  const normalized = [
    ...new Set(leadEmails.map((email) => normalizeLeadEmail(email)).filter(Boolean)),
  ];
  if (normalized.length === 0) {
    return {};
  }

  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_leads")
    .select("lead_email, ai_reply_agent_1")
    .eq("campaign_id", campaignId)
    .in("lead_email", normalized);

  if (error) {
    throw new Error(`Failed to batch load ai_reply_agent_leads: ${error.message}`);
  }

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    const email = String(row.lead_email ?? "").trim().toLowerCase();
    const text = row.ai_reply_agent_1;
    if (email && typeof text === "string" && text.trim()) {
      result[email] = text.trim();
    }
  }
  return result;
}
