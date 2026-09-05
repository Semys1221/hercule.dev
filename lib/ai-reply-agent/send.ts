import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  listEmails,
  replyToEmail,
} from "@/lib/instantly-bypass/client";
import { resolveThreadForReply } from "@/lib/instantly-bypass/thread-resolver";

import type { InstantlyEmailRecord } from "@/lib/instantly-bypass/types";

import { createAiReplyAgentClient } from "./supabase";

import type { AiReplyAgentConfig, AiReplyTargetType } from "./types";

const COLLISION_MINUTES = 15;
const HERCULE_FINGERPRINTS = ["beatrice meyer", "hercule.dev", "béatrice meyer"];

function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, "<br/>"))
    .filter(Boolean);
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

function readCtaFromLead(
  lead: { payload?: Record<string, unknown> | null } | null | undefined,
  targetType: AiReplyTargetType,
): string {
  const key =
    targetType === "buyer"
      ? "reservation_agence_link"
      : "reservation_entreprise_link";
  const fromLead = lead?.payload?.[key];
  if (typeof fromLead === "string" && fromLead.trim()) {
    return fromLead.trim();
  }
  return targetType === "buyer"
    ? "https://www.hercule.dev/reservation.html"
    : "https://www.hercule.dev/reservation-entreprise.html";
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
  const lead = await findLeadByEmailInCampaign(
    apiKey,
    params.campaignId,
    params.leadEmail,
  );

  const ctaLink = readCtaFromLead(lead, params.config.target_type);
  let bodyText = params.replyText;
  if (!bodyText.includes(ctaLink) && !bodyText.includes("hercule.dev")) {
    bodyText = `${bodyText}\n\nRéservez un créneau ici : ${ctaLink}`;
  }

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
    html: plainTextToHtml(bodyText),
  });

  return { replyToUuid: thread.replyToUuid };
}

export { plainTextToHtml };
