import {
  getInstantlyApiKey,
  listEmails,
  replyToEmail,
} from "@/lib/instantly-bypass/client";
import { resolveThreadForReply } from "@/lib/instantly-bypass/thread-resolver";

import type { InstantlyEmailRecord } from "@/lib/instantly-bypass/types";

import { formatReplyHtml, plainTextToHtml } from "./format-reply-html";
import { resolvePromptLinks } from "./lead-links";
import { createAiReplyAgentClient } from "./supabase";

import type { AiReplyAgentConfig } from "./types";

const COLLISION_MINUTES = 15;
const HERCULE_FINGERPRINTS = ["beatrice meyer", "hercule.dev", "béatrice meyer"];

async function readCtaForLead(
  leadEmail: string,
  config: AiReplyAgentConfig,
): Promise<string> {
  const links = await resolvePromptLinks(leadEmail, config.target_type);
  return links.primary;
}

function isHerculeSentBody(text: string): boolean {
  const lower = text.toLowerCase();
  return HERCULE_FINGERPRINTS.some((marker) => lower.includes(marker));
}

export async function hasRecentHerculeCollision(params: {
  campaignId: string;
  leadEmail: string;
}): Promise<boolean> {
  const apiKey = getInstantlyApiKey();
  const cutoff = new Date(Date.now() - COLLISION_MINUTES * 60 * 1000).toISOString();

  const sent = await listEmails(apiKey, {
    search: params.leadEmail,
    campaignId: params.campaignId,
    emailType: "sent",
    limit: 20,
  });

  for (const item of sent) {
    const record = item as InstantlyEmailRecord & {
      body?: { text?: string; html?: string };
      body_text?: string;
      body_html?: string;
    };
    const ts = record.timestamp_email ?? record.timestamp_created;
    if (!ts || ts < cutoff) continue;
    const body = `${record.body?.text ?? ""} ${record.body?.html ?? ""} ${record.body_text ?? ""} ${record.body_html ?? ""}`;
    if (isHerculeSentBody(body)) {
      return true;
    }
  }

  const client = createAiReplyAgentClient();
  const { data } = await client
    .from("instantly_bypass_events")
    .select("dispatched_at, status")
    .eq("campaign_id", params.campaignId)
    .eq("lead_email", params.leadEmail.toLowerCase())
    .eq("status", "sent")
    .gte("dispatched_at", cutoff)
    .limit(1);

  return Boolean(data && data.length > 0);
}

export async function sendAiReply(params: {
  config: AiReplyAgentConfig;
  campaignId: string;
  leadEmail: string;
  replyText: string;
  replySubject?: string;
  emailAccount?: string;
  preferredEmailId?: string;
}): Promise<{ replyToUuid: string }> {
  const apiKey = getInstantlyApiKey();
  const ctaLink = await readCtaForLead(params.leadEmail, params.config);

  const thread = await resolveThreadForReply(apiKey, {
    leadEmail: params.leadEmail,
    campaignId: params.campaignId,
    fallbackEaccount: params.emailAccount,
    preferredEmailId: params.preferredEmailId,
  });
  if (!thread) {
    throw new Error("thread_not_found");
  }

  const subject =
    params.replySubject?.trim() ||
    (thread.subject?.startsWith("Re:")
      ? thread.subject
      : `Re: ${thread.subject ?? "votre message"}`);

  await replyToEmail(apiKey, {
    eaccount: thread.eaccount,
    replyToUuid: thread.replyToUuid,
    subject,
    html: formatReplyHtml(params.replyText, { ctaLink }),
  });

  return { replyToUuid: thread.replyToUuid };
}

export { plainTextToHtml };
