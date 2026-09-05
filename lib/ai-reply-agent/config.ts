import { createAiReplyAgentClient } from "./supabase";

import type { AiReplyAgentConfig } from "./types";

export function isCampaignConfigReady(config: AiReplyAgentConfig): boolean {
  if (config.status !== "waiting_for_replies" && config.status !== "paused") {
    return false;
  }
  if (!config.initialized_at) {
    return false;
  }
  if (!config.prompt_snapshot.trim()) {
    return false;
  }
  if (!config.webhook_id || !config.ooo_webhook_id) {
    return false;
  }
  const expectedKey = `${config.niche_preset_id}_${config.target_type}`;
  if (config.prompt_key !== expectedKey) {
    return false;
  }
  return true;
}

/** When false, webhook still drafts but does not auto-send (manual review in Streamlit). */
export async function isAutoSendEnabled(): Promise<boolean> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_settings")
    .select("webhook_auto_send_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[ai-reply-agent] settings load failed:", error.message);
    return false;
  }
  return Boolean(data?.webhook_auto_send_enabled);
}

export async function loadAiReplyConfig(
  campaignId: string,
): Promise<AiReplyAgentConfig | null> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_config")
    .select("*")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ai_reply_agent_config: ${error.message}`);
  }
  return (data as AiReplyAgentConfig | null) ?? null;
}
