import { createClientsClient } from "@/lib/clients/supabase";

import { getGmailApi, getGmailMailbox, isGmailConfigured } from "./gmail-client";
import { processGmailMessageIds } from "./sync-incremental";

const BACKFILL_QUERY = "newer_than:90d";

export async function backfillClientInboxFromGmail(): Promise<{
  ok: boolean;
  listed: number;
  processed: number;
  matched: number;
  skipped: number;
  error?: string;
}> {
  if (!isGmailConfigured()) {
    return {
      ok: false,
      listed: 0,
      processed: 0,
      matched: 0,
      skipped: 0,
      error: "Gmail not configured",
    };
  }

  const gmail = getGmailApi();
  const messageIds: string[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const list = await gmail.users.messages.list({
        userId: "me",
        q: BACKFILL_QUERY,
        maxResults: 100,
        pageToken,
      });
      for (const msg of list.data.messages ?? []) {
        if (msg.id) messageIds.push(msg.id);
      }
      pageToken = list.data.nextPageToken ?? undefined;
    } while (pageToken);

    const result = await processGmailMessageIds(messageIds);

    const supabase = createClientsClient();
    const profile = await gmail.users.getProfile({ userId: "me" });
    await supabase.from("client_inbox_sync_state").upsert({
      mailbox: getGmailMailbox(),
      history_id: profile.data.historyId ?? null,
      last_sync_at: new Date().toISOString(),
      last_error: null,
    });

    return {
      ok: true,
      listed: messageIds.length,
      ...result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      listed: messageIds.length,
      processed: 0,
      matched: 0,
      skipped: 0,
      error: message,
    };
  }
}
