import {
  getEmailById,
  getInstantlyApiKey,
  listEmails,
} from "@/lib/legacy/instantly-bypass/client";

import type { InstantlyEmailRecord } from "@/lib/legacy/instantly-bypass/types";

const THREAD_MESSAGE_MAX_CHARS = 500;
const THREAD_MAX_MESSAGES = 12;

export type ThreadMessage = {
  direction: "sent" | "received";
  timestamp: string;
  subject: string;
  body: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripQuotedReply(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const patterns = [
    /<blockquote\b/i,
    /\nLe\s+\d{1,2}\s+.+?\s+a\s+(?:écrit|ecrit)\s*:/i,
    /\nOn\s+.+?\s+wrote\s*:/i,
    /\n>{1,2}\s/m,
    /\nDe\s*:\s*.+\nEnvoyé\s*:/i,
    /\nFrom:\s*.+\nSent:\s*/i,
  ];

  let earliest = trimmed.length;
  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (match && match.index < earliest) {
      earliest = match.index;
    }
  }

  return (earliest < trimmed.length ? trimmed.slice(0, earliest) : trimmed).trim();
}

function truncateThreadBody(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= THREAD_MESSAGE_MAX_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, THREAD_MESSAGE_MAX_CHARS - 1)}…`;
}

function extractBodyText(record: InstantlyEmailRecord): string {
  const textParts = [record.body?.text, record.body_text]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n")
    .trim();
  if (textParts) {
    return stripQuotedReply(textParts);
  }

  const htmlParts = [record.body?.html, record.body_html]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n")
    .trim();
  if (htmlParts) {
    return stripQuotedReply(stripHtml(htmlParts));
  }

  const preview = record.content_preview?.trim();
  return preview ? stripQuotedReply(preview) : "";
}

async function enrichEmailBody(
  apiKey: string,
  record: InstantlyEmailRecord,
): Promise<string> {
  const initial = extractBodyText(record);
  if (initial || !record.id?.trim()) {
    return initial;
  }

  const detail = await getEmailById(apiKey, record.id.trim());
  return detail ? extractBodyText(detail) : "";
}

function recordDirection(
  record: InstantlyEmailRecord,
  leadEmail: string,
): "sent" | "received" {
  const from = record.from_address_email?.trim().toLowerCase() ?? "";
  const normalizedLead = leadEmail.trim().toLowerCase();
  if (from && from === normalizedLead) {
    return "received";
  }
  return "sent";
}

function toThreadMessage(
  record: InstantlyEmailRecord,
  leadEmail: string,
  body: string,
): ThreadMessage {
  return {
    direction: recordDirection(record, leadEmail),
    timestamp: record.timestamp_email ?? record.timestamp_created ?? "",
    subject: record.subject?.trim() ?? "",
    body: truncateThreadBody(body),
  };
}

async function fetchThreadById(
  apiKey: string,
  params: { threadId: string; campaignId: string; leadEmail: string; limit: number },
): Promise<ThreadMessage[]> {
  const items = await listEmails(apiKey, {
    search: `thread:${params.threadId}`,
    campaignId: params.campaignId,
    limit: params.limit,
  });

  const messages: ThreadMessage[] = [];
  for (const item of items) {
    const body = await enrichEmailBody(apiKey, item);
    messages.push(toThreadMessage(item, params.leadEmail, body));
  }

  return messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

async function fetchThreadByLead(
  apiKey: string,
  params: { campaignId: string; leadEmail: string; limit: number },
): Promise<ThreadMessage[]> {
  const [sent, received] = await Promise.all([
    listEmails(apiKey, {
      search: params.leadEmail,
      campaignId: params.campaignId,
      emailType: "sent",
      limit: params.limit,
    }),
    listEmails(apiKey, {
      search: params.leadEmail,
      campaignId: params.campaignId,
      emailType: "received",
      limit: params.limit,
    }),
  ]);

  const messages: ThreadMessage[] = [];
  for (const item of [...sent, ...received]) {
    const body = await enrichEmailBody(apiKey, item);
    messages.push(toThreadMessage(item, params.leadEmail, body));
  }

  return messages
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-params.limit);
}

export async function fetchThreadMessages(params: {
  campaignId: string;
  leadEmail: string;
  threadId?: string | null;
  preferredEmailId?: string | null;
  limit?: number;
}): Promise<ThreadMessage[]> {
  const apiKey = getInstantlyApiKey();
  const limit = Math.max(1, Math.min(THREAD_MAX_MESSAGES, params.limit ?? THREAD_MAX_MESSAGES));

  let threadId = params.threadId?.trim() ?? "";
  if (!threadId && params.preferredEmailId?.trim()) {
    const preferred = await getEmailById(apiKey, params.preferredEmailId.trim());
    threadId = preferred?.thread_id?.trim() ?? "";
  }

  if (threadId) {
    return fetchThreadById(apiKey, {
      threadId,
      campaignId: params.campaignId,
      leadEmail: params.leadEmail,
      limit,
    });
  }

  return fetchThreadByLead(apiKey, {
    campaignId: params.campaignId,
    leadEmail: params.leadEmail,
    limit,
  });
}

export function formatThreadForGrok(messages: ThreadMessage[]): string | null {
  const usable = messages.filter((message) => message.body.trim());
  if (usable.length === 0) {
    return null;
  }

  return usable
    .map((message) => {
      const speaker = message.direction === "sent" ? "Hercule" : "Prospect";
      const subject = message.subject ? ` — ${message.subject}` : "";
      return `[${speaker}${subject}]\n${message.body}`;
    })
    .join("\n\n");
}
