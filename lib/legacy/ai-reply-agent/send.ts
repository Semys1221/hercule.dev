import {
  getInstantlyApiKey,
  listEmails,
  replyToEmail,
} from "@/lib/legacy/instantly-bypass/client";
import { resolveThreadForReply } from "@/lib/legacy/instantly-bypass/thread-resolver";

import type { InstantlyEmailRecord } from "@/lib/legacy/instantly-bypass/types";

import { formatReplyHtml, plainTextToHtml } from "./format-reply-html";
import { isComptableDeliveryNichePreset } from "@/lib/site/niche-preset";
import { resolvePromptLinks } from "./lead-links";
import { createAiReplyAgentClient } from "./supabase";

import type { AiReplyAgentConfig } from "./types";

const COLLISION_MINUTES = 15;
const HERCULE_FINGERPRINTS = ["beatrice meyer", "hercule.dev", "béatrice meyer"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCtaForLead(
  leadEmail: string,
  config: AiReplyAgentConfig,
  campaignId?: string,
): Promise<string> {
  const links = await resolvePromptLinks(
    leadEmail,
    config.target_type,
    campaignId ?? null,
  );
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

async function resolveThreadWithRetry(
  apiKey: string,
  params: {
    leadEmail: string;
    campaignId: string;
    fallbackEaccount?: string;
    preferredEmailId?: string;
  },
): Promise<Awaited<ReturnType<typeof resolveThreadForReply>>> {
  let thread = await resolveThreadForReply(apiKey, params);
  if (thread) {
    return thread;
  }

  await sleep(2000);
  thread = await resolveThreadForReply(apiKey, {
    ...params,
    preferredEmailId: undefined,
  });
  return thread;
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
  const ctaLink = await readCtaForLead(
    params.leadEmail,
    params.config,
    params.campaignId,
  );

  const thread = await resolveThreadWithRetry(apiKey, {
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

  const signatureMode = isComptableDeliveryNichePreset(
    params.config.niche_preset_id ?? "",
  )
    ? "jum"
    : "hercule";

  const payload = {
    eaccount: thread.eaccount,
    replyToUuid: thread.replyToUuid,
    subject,
    html: formatReplyHtml(params.replyText, { ctaLink, signatureMode }),
  };

  try {
    await replyToEmail(apiKey, payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/404|not found/i.test(message)) {
      throw err;
    }

    const refreshed = await resolveThreadWithRetry(apiKey, {
      leadEmail: params.leadEmail,
      campaignId: params.campaignId,
      fallbackEaccount: params.emailAccount,
      preferredEmailId: undefined,
    });
    if (!refreshed) {
      throw new Error("thread_not_found");
    }

    await replyToEmail(apiKey, {
      ...payload,
      eaccount: refreshed.eaccount,
      replyToUuid: refreshed.replyToUuid,
    });
    return { replyToUuid: refreshed.replyToUuid };
  }

  return { replyToUuid: thread.replyToUuid };
}

export { plainTextToHtml };
