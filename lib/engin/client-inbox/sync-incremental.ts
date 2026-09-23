import type { gmail_v1 } from "googleapis";

import { createClientsClient } from "@/lib/clients/supabase";

import { loadClientEmailIndex } from "./client-email-index";
import { getGmailApi, getGmailMailbox, isGmailConfigured } from "./gmail-client";
import { matchMessageToClient } from "./match-message";
import { parseGmailMessage } from "./parse-gmail-message";
import { upsertMatchedMessage } from "./persist-message";

async function fetchFullMessage(
  gmail: gmail_v1.Gmail,
  messageId: string,
): Promise<ReturnType<typeof parseGmailMessage>> {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  return parseGmailMessage(res.data);
}

export async function processGmailMessageIds(
  messageIds: string[],
): Promise<{ processed: number; matched: number; skipped: number }> {
  if (messageIds.length === 0) {
    return { processed: 0, matched: 0, skipped: 0 };
  }

  const supabase = createClientsClient();
  const index = await loadClientEmailIndex(supabase);
  const gmail = getGmailApi();

  let processed = 0;
  let matched = 0;
  let skipped = 0;

  for (const id of messageIds) {
    processed += 1;
    try {
      const parsed = await fetchFullMessage(gmail, id);
      if (!parsed) {
        skipped += 1;
        continue;
      }
      const hit = matchMessageToClient(index, parsed);
      if (!hit) {
        skipped += 1;
        continue;
      }
      await upsertMatchedMessage(supabase, {
        clientId: hit.clientId,
        ambiguous: hit.ambiguous,
        message: parsed,
      });
      matched += 1;
    } catch (err) {
      console.error("[client-inbox] message process failed", id, err);
      skipped += 1;
    }
  }

  return { processed, matched, skipped };
}

export async function syncGmailIncremental(): Promise<{
  ok: boolean;
  mailbox: string;
  newHistoryId?: string;
  processed: number;
  matched: number;
  skipped: number;
  error?: string;
}> {
  if (!isGmailConfigured()) {
    return {
      ok: false,
      mailbox: getGmailMailbox(),
      processed: 0,
      matched: 0,
      skipped: 0,
      error: "Gmail not configured",
    };
  }

  const mailbox = getGmailMailbox();
  const supabase = createClientsClient();
  const gmail = getGmailApi();

  const { data: stateRow } = await supabase
    .from("client_inbox_sync_state")
    .select("*")
    .eq("mailbox", mailbox)
    .maybeSingle();

  let startHistoryId = stateRow?.history_id ?? null;

  if (!startHistoryId) {
    const profile = await gmail.users.getProfile({ userId: "me" });
    startHistoryId = profile.data.historyId ?? null;
    await supabase.from("client_inbox_sync_state").upsert({
      mailbox,
      history_id: startHistoryId,
      last_sync_at: new Date().toISOString(),
      last_error: null,
    });
    return {
      ok: true,
      mailbox,
      newHistoryId: startHistoryId ?? undefined,
      processed: 0,
      matched: 0,
      skipped: 0,
    };
  }

  const messageIds: string[] = [];
  let pageToken: string | undefined;
  let latestHistoryId = startHistoryId;

  try {
    do {
      const history = await gmail.users.history.list({
        userId: "me",
        startHistoryId,
        historyTypes: ["messageAdded"],
        pageToken,
      });

      if (history.data.historyId) {
        latestHistoryId = history.data.historyId;
      }

      for (const record of history.data.history ?? []) {
        for (const added of record.messagesAdded ?? []) {
          if (added.message?.id) {
            messageIds.push(added.message.id);
          }
        }
      }
      pageToken = history.data.nextPageToken ?? undefined;
    } while (pageToken);

    const uniqueIds = [...new Set(messageIds)];
    const result = await processGmailMessageIds(uniqueIds);

    await supabase.from("client_inbox_sync_state").upsert({
      mailbox,
      history_id: latestHistoryId,
      last_sync_at: new Date().toISOString(),
      last_error: null,
    });

    return {
      ok: true,
      mailbox,
      newHistoryId: latestHistoryId,
      ...result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("History") || message.includes("historyId")) {
      const profile = await gmail.users.getProfile({ userId: "me" });
      const resetId = profile.data.historyId ?? null;
      await supabase.from("client_inbox_sync_state").upsert({
        mailbox,
        history_id: resetId,
        last_sync_at: new Date().toISOString(),
        last_error: `History reset: ${message}`,
      });
      return {
        ok: true,
        mailbox,
        newHistoryId: resetId ?? undefined,
        processed: 0,
        matched: 0,
        skipped: 0,
      };
    }
    await supabase.from("client_inbox_sync_state").upsert({
      mailbox,
      history_id: startHistoryId,
      last_sync_at: new Date().toISOString(),
      last_error: message,
    });
    return {
      ok: false,
      mailbox,
      processed: 0,
      matched: 0,
      skipped: 0,
      error: message,
    };
  }
}
