import type { gmail_v1 } from "googleapis";

import { parseAddressListHeader, parseFromHeader } from "./normalize-email";
import type { ParsedGmailMessage } from "./types";

function headerValue(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string {
  const lower = name.toLowerCase();
  for (const h of headers ?? []) {
    if (h.name?.toLowerCase() === lower && h.value) {
      return h.value;
    }
  }
  return "";
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractBodies(part: gmail_v1.Schema$MessagePart | undefined): {
  text: string;
  html: string | null;
} {
  if (!part) {
    return { text: "", html: null };
  }

  let text = "";
  let html: string | null = null;

  if (part.mimeType === "text/plain" && part.body?.data) {
    text = decodeBase64Url(part.body.data);
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    html = decodeBase64Url(part.body.data);
  }

  for (const child of part.parts ?? []) {
    const nested = extractBodies(child);
    if (!text && nested.text) text = nested.text;
    if (!html && nested.html) html = nested.html;
  }

  return { text, html };
}

export function parseGmailMessage(
  message: gmail_v1.Schema$Message,
): ParsedGmailMessage | null {
  const gmailMessageId = message.id;
  const gmailThreadId = message.threadId;
  if (!gmailMessageId || !gmailThreadId) return null;

  const headers = message.payload?.headers ?? [];
  const headerMap: Record<string, string> = {};
  for (const h of headers) {
    if (h.name && h.value) {
      headerMap[h.name.toLowerCase()] = h.value;
    }
  }

  const fromRaw = headerValue(headers, "From");
  const fromEmail = parseFromHeader(fromRaw) ?? fromRaw.trim();
  const toEmails = parseAddressListHeader(headerValue(headers, "To"));
  const ccEmails = parseAddressListHeader(headerValue(headers, "Cc"));
  const subject = headerValue(headers, "Subject");
  const { text, html } = extractBodies(message.payload ?? undefined);

  const internalDate = message.internalDate
    ? new Date(Number(message.internalDate))
    : new Date();

  return {
    gmailMessageId,
    gmailThreadId,
    fromEmail,
    toEmails: [...toEmails, ...ccEmails],
    subject,
    bodyText: text.trim() || (html ? stripHtml(html) : ""),
    bodyHtml: html,
    sentAt: internalDate,
    headers: headerMap,
    snippet: message.snippet ?? "",
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
