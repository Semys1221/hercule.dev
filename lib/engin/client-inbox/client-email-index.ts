import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeEmailAddress } from "./normalize-email";

export type ClientEmailIndexEntry = {
  clientId: string;
  createdAt: string;
};

export type ClientEmailIndex = Map<string, ClientEmailIndexEntry[]>;

export async function loadClientEmailIndex(
  client: SupabaseClient,
): Promise<ClientEmailIndex> {
  const { data, error } = await client
    .from("clients")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Client email index failed: ${error.message}`);
  }

  const index: ClientEmailIndex = new Map();
  for (const row of data ?? []) {
    const email = normalizeEmailAddress(String(row.email ?? ""));
    if (!email) continue;
    const list = index.get(email) ?? [];
    list.push({
      clientId: String(row.id),
      createdAt: String(row.created_at),
    });
    index.set(email, list);
  }
  return index;
}

export function resolveClientForEmail(
  index: ClientEmailIndex,
  email: string,
): { clientId: string; ambiguous: boolean } | null {
  const normalized = normalizeEmailAddress(email);
  if (!normalized) return null;
  const entries = index.get(normalized);
  if (!entries?.length) return null;
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const chosen = sorted[0]!;
  return {
    clientId: chosen.clientId,
    ambiguous: sorted.length > 1,
  };
}
