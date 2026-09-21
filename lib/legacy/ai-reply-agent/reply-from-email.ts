import {
  findLeadByEmailInCampaign,
  getEmailById,
  patchLeadCustomVariables,
} from "@/lib/legacy/instantly-bypass/client";

import type { InstantlyReplyWebhookPayload } from "./types";

export const REPLY_FROM_EMAIL_CUSTOM_VAR = "reply_from_email";

const AUTOMATED_SENDER_PATTERNS = [
  /@calendly\.com$/i,
  /@notifications\./i,
  /^no-?reply@/i,
  /^noreply@/i,
  /^mailer-daemon@/i,
  /^postmaster@/i,
  /^bounce@/i,
  /^notifications@/i,
];

const SIGNATURE_EMAIL_RE =
  /(?:^|[\s>✉️📧])([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gim;

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function isAutomatedSenderEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    return true;
  }
  return AUTOMATED_SENDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function extractAlternateEmailFromText(
  text: string,
  leadEmail: string,
): string | null {
  const lead = normalizeEmail(leadEmail);
  const seen = new Set<string>();
  for (const match of text.matchAll(SIGNATURE_EMAIL_RE)) {
    const candidate = normalizeEmail(match[1]);
    if (!candidate || candidate === lead || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    if (isAutomatedSenderEmail(candidate)) {
      continue;
    }
    return candidate;
  }
  return null;
}

export function resolveReplyFromFromPayload(
  payload: InstantlyReplyWebhookPayload,
): string | null {
  const direct = normalizeEmail(
    (payload.reply_from_email as string | undefined) ??
      (payload.from_address_email as string | undefined) ??
      (payload.from_email as string | undefined),
  );
  if (direct && !isAutomatedSenderEmail(direct)) {
    return direct;
  }
  return null;
}

export async function resolveReplyFromEmail(
  apiKey: string,
  params: {
    payload: InstantlyReplyWebhookPayload;
    leadEmail: string;
    instantlyEmailId?: string | null;
  },
): Promise<string | null> {
  const fromPayload = resolveReplyFromFromPayload(params.payload);
  if (fromPayload) {
    return fromPayload;
  }

  const emailId = params.instantlyEmailId?.trim();
  if (emailId) {
    const record = await getEmailById(apiKey, emailId);
    const fromApi = normalizeEmail(record?.from_address_email);
    if (fromApi && !isAutomatedSenderEmail(fromApi)) {
      return fromApi;
    }
  }

  const inboundText = [
    params.payload.reply_text,
    params.payload.reply_html,
    params.payload.reply_text_snippet,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
  if (inboundText.trim()) {
    return extractAlternateEmailFromText(inboundText, params.leadEmail);
  }

  return null;
}

function readLeadCustomVariables(
  lead: { payload?: Record<string, unknown> | null } | null,
): Record<string, string> {
  const merged: Record<string, string> = {};
  const payload = lead?.payload;
  if (!payload || typeof payload !== "object") {
    return merged;
  }
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    merged[key] = String(value);
  }
  return merged;
}

export type SyncReplyFromEmailResult = {
  replyFromEmail: string | null;
  synced: boolean;
  reason?: string;
};

export async function syncLeadReplyFromEmail(
  apiKey: string,
  params: {
    campaignId: string;
    leadEmail: string;
    replyFromEmail: string | null;
  },
): Promise<SyncReplyFromEmailResult> {
  const leadEmail = normalizeEmail(params.leadEmail);
  const replyFromEmail = normalizeEmail(params.replyFromEmail);
  if (!replyFromEmail || replyFromEmail === leadEmail) {
    return { replyFromEmail: replyFromEmail || null, synced: false };
  }
  if (isAutomatedSenderEmail(replyFromEmail)) {
    return {
      replyFromEmail,
      synced: false,
      reason: "automated_sender",
    };
  }

  const lead = await findLeadByEmailInCampaign(
    apiKey,
    params.campaignId,
    leadEmail,
  );
  if (!lead?.id) {
    return {
      replyFromEmail,
      synced: false,
      reason: "lead_not_found",
    };
  }

  const existing = readLeadCustomVariables(lead);
  if (normalizeEmail(existing[REPLY_FROM_EMAIL_CUSTOM_VAR]) === replyFromEmail) {
    return { replyFromEmail, synced: false, reason: "already_synced" };
  }

  await patchLeadCustomVariables(apiKey, lead.id, {
    ...existing,
    [REPLY_FROM_EMAIL_CUSTOM_VAR]: replyFromEmail,
  });

  console.info(
    `[ai-reply-agent] synced ${REPLY_FROM_EMAIL_CUSTOM_VAR} for ${leadEmail} -> ${replyFromEmail}`,
  );

  return { replyFromEmail, synced: true };
}
