import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadCategory } from "./types";
import { ALL_LEAD_CATEGORIES } from "./types";

const SLUG_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SLUG_LENGTH = 6;
const MAX_ATTEMPTS = 20;
const TABLES: LeadCategory[] = [...ALL_LEAD_CATEGORIES];

function isMissingRelationError(message: string): boolean {
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  );
}

export function generateSlug(): string {
  const bytes = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length],
  ).join("");
}

export async function loadSlugSet(client: SupabaseClient): Promise<Set<string>> {
  const slugs = new Set<string>();
  for (const table of TABLES) {
    const { data, error } = await client.from(table).select("slug");
    if (error) {
      if (isMissingRelationError(error.message)) {
        continue;
      }
      throw new Error(`Failed to load slugs from ${table}: ${error.message}`);
    }
    for (const row of data ?? []) {
      const slug = String(row.slug ?? "").trim();
      if (slug) slugs.add(slug);
    }
  }
  return slugs;
}

export function allocateSlugs(existing: Set<string>, count: number): string[] {
  if (count <= 0) return [];

  const allocated: string[] = [];
  const reserved = new Set(existing);
  let attempts = 0;
  const maxAttempts = Math.max(count * MAX_ATTEMPTS, MAX_ATTEMPTS);

  while (allocated.length < count) {
    attempts += 1;
    if (attempts > maxAttempts) {
      throw new Error(
        `Cannot allocate ${count} unique slugs after ${maxAttempts} attempts`,
      );
    }
    const slug = generateSlug();
    if (reserved.has(slug)) continue;
    reserved.add(slug);
    allocated.push(slug);
  }

  return allocated;
}
