import type { SupabaseClient } from "@supabase/supabase-js";

import { findClientById } from "@/lib/clients/supabase";
import { buildReplySubject, buildThreadHeaders } from "@/lib/(resend)/communication/threading";

import { getGmailApi, getGmailFromHeader, getGmailMailbox } from "./gmail-client";
import { normalizeEmailAddress } from "./normalize-email";
import { refreshThreadAggregate, upsertMatchedMessage } from "./persist-message";
import { parseGmailMessage } from "./parse-gmail-message";

function encodeRawMessage(raw: string): string {
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendClientInboxMessage(
  client: SupabaseClient,
  params: {
    clientId: string;
    body: string;
    subject?: string;
    threadId?: string;
    replyToMessageId?: string;
  },
): Promise<{ gmailMessageId: string; threadId: string }> {
  const clientRow = await findClientById(client, params.clientId);
  if (!clientRow) {
    throw new Error("Client not found");
  }

  const toEmail = normalizeEmailAddress(clientRow.email);
  if (!toEmail) {
    throw new Error("Client email invalid");
  }

  const from = getGmailFromHeader();
  let subject = params.subject?.trim() || "";
  let gmailThreadId: string | undefined;
  let inReplyHeaders: Record<string, string> = {};
  let enginThreadId = params.threadId;

  if (params.replyToMessageId && enginThreadId) {
    const { data: replyMsg } = await client
      .from("client_inbox_messages")
      .select("gmail_message_id, subject, raw_headers, thread_id")
      .eq("id", params.replyToMessageId)
      .maybeSingle();

    if (replyMsg) {
      const messageIdHeader =
        (replyMsg.raw_headers as Record<string, string>)?.["message-id"] ??
        `<${replyMsg.gmail_message_id}>`;
      inReplyHeaders = buildThreadHeaders([messageIdHeader]);
      subject = subject || buildReplySubject(String(replyMsg.subject ?? ""));
      enginThreadId = String(replyMsg.thread_id);
    }
  }

  if (enginThreadId && !gmailThreadId) {
    const { data: threadRow } = await client
      .from("client_inbox_threads")
      .select("gmail_thread_id, subject")
      .eq("id", enginThreadId)
      .maybeSingle();
    if (threadRow) {
      gmailThreadId = String(threadRow.gmail_thread_id);
      if (!subject) {
        subject = buildReplySubject(String(threadRow.subject ?? ""));
      }
    }
  }

  if (!subject) {
    subject = "Message Hercule";
  }

  const headerLines = [
    `From: ${from}`,
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    ...Object.entries(inReplyHeaders).map(([key, value]) => `${key}: ${value}`),
    "",
    params.body.trim(),
  ];

  const raw = encodeRawMessage(headerLines.join("\r\n"));
  const gmail = getGmailApi();
  const sent = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: gmailThreadId,
    },
  });

  const gmailMessageId = sent.data.id;
  if (!gmailMessageId) {
    throw new Error("Gmail send returned no message id");
  }

  const full = await gmail.users.messages.get({
    userId: "me",
    id: gmailMessageId,
    format: "full",
  });
  const parsed = parseGmailMessage(full.data);
  if (!parsed) {
    throw new Error("Failed to parse sent message");
  }

  const { threadId } = await upsertMatchedMessage(client, {
    clientId: params.clientId,
    ambiguous: false,
    message: parsed,
  });

  await client
    .from("client_inbox_drafts")
    .delete()
    .eq("client_id", params.clientId)
    .eq("thread_id", threadId);

  await refreshThreadAggregate(client, threadId);

  return { gmailMessageId, threadId };
}
