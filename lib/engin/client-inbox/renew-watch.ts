import { createClientsClient } from "@/lib/clients/supabase";

import { getGmailApi, getGmailMailbox, isGmailConfigured } from "./gmail-client";

const RENEW_BEFORE_MS = 24 * 60 * 60 * 1000;

export async function renewGmailWatchIfNeeded(): Promise<{
  renewed: boolean;
  expiration?: string;
  error?: string;
}> {
  if (!isGmailConfigured()) {
    return { renewed: false, error: "Gmail not configured" };
  }

  const topic = process.env.GMAIL_PUBSUB_TOPIC?.trim();
  if (!topic) {
    return { renewed: false, error: "GMAIL_PUBSUB_TOPIC not set" };
  }

  const mailbox = getGmailMailbox();
  const supabase = createClientsClient();
  const { data: stateRow } = await supabase
    .from("client_inbox_sync_state")
    .select("watch_expiration")
    .eq("mailbox", mailbox)
    .maybeSingle();

  const expiration = stateRow?.watch_expiration
    ? new Date(stateRow.watch_expiration).getTime()
    : 0;
  const now = Date.now();

  if (expiration - now > RENEW_BEFORE_MS) {
    return { renewed: false, expiration: stateRow?.watch_expiration ?? undefined };
  }

  try {
    const gmail = getGmailApi();
    const watch = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: topic,
        labelIds: ["INBOX", "SENT"],
      },
    });

    const watchExpirationMs = watch.data.expiration
      ? Number(watch.data.expiration)
      : null;
    const watchExpirationIso = watchExpirationMs
      ? new Date(watchExpirationMs).toISOString()
      : null;

    await supabase.from("client_inbox_sync_state").upsert({
      mailbox,
      history_id: watch.data.historyId ?? undefined,
      watch_expiration: watchExpirationIso,
      last_error: null,
    });

    return { renewed: true, expiration: watchExpirationIso ?? undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("client_inbox_sync_state").upsert({
      mailbox,
      last_error: message,
    });
    return { renewed: false, error: message };
  }
}
