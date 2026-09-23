import type { SupabaseClient } from "@supabase/supabase-js";

import { isUnreadEngin } from "./needs-reply";

export type InboxListFilter = "all" | "needs_reply" | "unread";

export async function listClientInboxThreads(
  client: SupabaseClient,
  params: { filter?: InboxListFilter; limit?: number },
) {
  const filter = params.filter ?? "all";
  const limit = params.limit ?? 100;

  let query = client
    .from("client_inbox_threads")
    .select(
      `
      id,
      client_id,
      gmail_thread_id,
      subject,
      snippet,
      last_message_at,
      last_direction,
      needs_reply,
      ambiguous_client,
      clients:client_id (
        id,
        email,
        first_name,
        slug,
        product_statut
      ),
      client_inbox_thread_state (
        read_at,
        snoozed_until,
        resolved_at
      )
    `,
    )
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (filter === "needs_reply") {
    query = query.eq("needs_reply", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  let rows = data ?? [];
  if (filter === "unread") {
    rows = rows.filter((row) => {
      const state = Array.isArray(row.client_inbox_thread_state)
        ? row.client_inbox_thread_state[0]
        : row.client_inbox_thread_state;
      return isUnreadEngin(state ?? null);
    });
  }

  return rows;
}

export async function getInboxCounts(client: SupabaseClient) {
  const { count: needsReply, error: needsError } = await client
    .from("client_inbox_threads")
    .select("*", { count: "exact", head: true })
    .eq("needs_reply", true);

  if (needsError) {
    throw new Error(needsError.message);
  }

  const { data: unreadRows, error: unreadError } = await client
    .from("client_inbox_thread_state")
    .select("thread_id")
    .is("read_at", null);

  if (unreadError) {
    throw new Error(unreadError.message);
  }

  return {
    needsReply: needsReply ?? 0,
    unreadThreads: unreadRows?.length ?? 0,
  };
}

export async function listMessagesForThread(
  client: SupabaseClient,
  threadId: string,
) {
  const { data, error } = await client
    .from("client_inbox_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listThreadsForClient(
  client: SupabaseClient,
  clientId: string,
) {
  const { data, error } = await client
    .from("client_inbox_threads")
    .select("*")
    .eq("client_id", clientId)
    .order("last_message_at", { ascending: false });

  if (error) {
    throw error.message.includes("does not exist")
      ? new Error("Inbox tables missing — apply migration 20261301000000_client_inbox_gmail")
      : new Error(error.message);
  }
  return data ?? [];
}
