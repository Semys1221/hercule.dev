import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import type { ClientRow } from "./types";

export function createClientsClient(): SupabaseClient {
  return createLinkTrackingClient();
}

export async function findClientBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<ClientRow | null> {
  const normalized = slug.trim();
  if (!normalized) {
    return null;
  }

  const { data, error } = await client
    .from("clients")
    .select("*")
    .eq("slug", normalized)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.message.includes("schema cache")
    ) {
      return null;
    }
    throw new Error(`Client lookup failed: ${error.message}`);
  }

  return (data as ClientRow | null) ?? null;
}

export async function findClientById(
  client: SupabaseClient,
  clientId: string,
): Promise<ClientRow | null> {
  const { data, error } = await client
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Client lookup failed: ${error.message}`);
  }

  return (data as ClientRow | null) ?? null;
}

export function buildClientDashboardUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.hercule.dev";
  return `${base.replace(/\/$/, "")}/clients/${slug}`;
}
