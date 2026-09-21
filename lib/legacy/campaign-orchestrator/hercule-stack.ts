import { createAiReplyAgentClient } from "@/lib/legacy/ai-reply-agent/supabase";
import {
  loadBypassConfig,
  saveBypassConfig,
} from "@/lib/legacy/instantly-bypass/templates";

import type { HerculeStackUpdate } from "./types";

export async function pauseHerculeStack(
  campaignId: string,
): Promise<HerculeStackUpdate> {
  const result: HerculeStackUpdate = { bypass: false, replyAgent: false };

  const bypassConfig = await loadBypassConfig(campaignId);
  if (bypassConfig) {
    await saveBypassConfig({
      campaign_id: campaignId,
      webhook_auto_send_enabled: false,
      pipeline_auto_advance_enabled: false,
    });
    result.bypass = true;
  }

  const replyClient = createAiReplyAgentClient();
  const { data, error } = await replyClient
    .from("ai_reply_agent_config")
    .select("campaign_id")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load ai_reply_agent_config for ${campaignId}: ${error.message}`,
    );
  }

  if (data) {
    const { error: updateError } = await replyClient
      .from("ai_reply_agent_config")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);

    if (updateError) {
      throw new Error(
        `Failed to pause ai_reply_agent_config for ${campaignId}: ${updateError.message}`,
      );
    }
    result.replyAgent = true;
  }

  return result;
}

export async function activateHerculeStack(
  campaignId: string,
): Promise<HerculeStackUpdate> {
  const result: HerculeStackUpdate = { bypass: false, replyAgent: false };

  const bypassConfig = await loadBypassConfig(campaignId);
  if (bypassConfig) {
    await saveBypassConfig({
      campaign_id: campaignId,
      webhook_auto_send_enabled: true,
      pipeline_auto_advance_enabled: true,
    });
    result.bypass = true;
  }

  const replyClient = createAiReplyAgentClient();
  const { data, error } = await replyClient
    .from("ai_reply_agent_config")
    .select("campaign_id")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load ai_reply_agent_config for ${campaignId}: ${error.message}`,
    );
  }

  if (data) {
    const { error: updateError } = await replyClient
      .from("ai_reply_agent_config")
      .update({
        status: "waiting_for_replies",
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);

    if (updateError) {
      throw new Error(
        `Failed to activate ai_reply_agent_config for ${campaignId}: ${updateError.message}`,
      );
    }
    result.replyAgent = true;
  }

  return result;
}
