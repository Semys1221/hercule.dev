import type { SupabaseClient } from "@supabase/supabase-js";

import { computeNeedsReply } from "./needs-reply";
import type { ClientInboxThreadStateRow, ParsedGmailMessage } from "./types";
import { messageDirection } from "./match-message";

export async function upsertMatchedMessage(
  client: SupabaseClient,
  params: {
    clientId: string;
    ambiguous: boolean;
    message: ParsedGmailMessage;
  },
): Promise<{ threadId: string; inserted: boolean }> {
  const direction = messageDirection(params.message);

  const { data: existingMsg } = await client
    .from("client_inbox_messages")
    .select("id, thread_id")
    .eq("gmail_message_id", params.message.gmailMessageId)
    .maybeSingle();

  if (existingMsg?.thread_id) {
    return { threadId: String(existingMsg.thread_id), inserted: false };
  }

  const nowIso = new Date().toISOString();

  const { data: threadRow, error: threadError } = await client
    .from("client_inbox_threads")
    .upsert(
      {
        gmail_thread_id: params.message.gmailThreadId,
        client_id: params.clientId,
        subject: params.message.subject || "(sans objet)",
        snippet: params.message.snippet.slice(0, 500),
        last_message_at: params.message.sentAt.toISOString(),
        last_direction: direction,
        ambiguous_client: params.ambiguous,
        updated_at: nowIso,
      },
      { onConflict: "gmail_thread_id" },
    )
    .select("id")
    .single();

  if (threadError || !threadRow?.id) {
    throw new Error(threadError?.message ?? "Thread upsert failed");
  }

  const threadId = String(threadRow.id);

  const { error: msgError } = await client.from("client_inbox_messages").insert({
    thread_id: threadId,
    gmail_message_id: params.message.gmailMessageId,
    direction,
    from_email: params.message.fromEmail,
    to_emails: params.message.toEmails,
    subject: params.message.subject,
    body_text: params.message.bodyText,
    body_html: params.message.bodyHtml,
    sent_at: params.message.sentAt.toISOString(),
    raw_headers: params.message.headers,
  });

  if (msgError) {
    if (msgError.message.includes("duplicate")) {
      return { threadId, inserted: false };
    }
    throw new Error(msgError.message);
  }

  await client.from("client_inbox_thread_state").upsert(
    { thread_id: threadId },
    { onConflict: "thread_id", ignoreDuplicates: true },
  );

  await refreshThreadAggregate(client, threadId);

  return { threadId, inserted: true };
}

export async function refreshThreadAggregate(
  client: SupabaseClient,
  threadId: string,
): Promise<void> {
  const { data: lastMsg } = await client
    .from("client_inbox_messages")
    .select("direction, sent_at, subject, body_text")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastMsg) return;

  const { data: stateRow } = await client
    .from("client_inbox_thread_state")
    .select("read_at, snoozed_until, resolved_at")
    .eq("thread_id", threadId)
    .maybeSingle();

  const state = (stateRow as ClientInboxThreadStateRow | null) ?? null;
  const lastDirection = lastMsg.direction as "in" | "out";
  const needsReply = computeNeedsReply({
    lastDirection,
    state,
  });

  const snippetSource = String(lastMsg.body_text ?? "").slice(0, 500);

  await client
    .from("client_inbox_threads")
    .update({
      last_message_at: lastMsg.sent_at,
      last_direction: lastDirection,
      needs_reply: needsReply,
      snippet: snippetSource,
      subject: lastMsg.subject ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  if (lastDirection === "in" && needsReply) {
    await client
      .from("client_inbox_thread_state")
      .update({ read_at: null })
      .eq("thread_id", threadId);
  }
}
