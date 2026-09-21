import { randomInt } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TABLES = ["agence", "entreprise"] as const;
const MAX_ATTEMPTS = 20;

function generateSlug(): string {
  let slug = "";
  for (let i = 0; i < 6; i += 1) {
    slug += ALPHABET[randomInt(ALPHABET.length)];
  }
  return slug;
}

async function slugExists(client: SupabaseClient, slug: string): Promise<boolean> {
  for (const table of TABLES) {
    const { data, error } = await client
      .from(table)
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Slug lookup failed on ${table}: ${error.message}`);
    }
    if (data) {
      return true;
    }
  }
  return false;
}

export async function generateUniqueSlug(client: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const slug = generateSlug();
    if (!(await slugExists(client, slug))) {
      return slug;
    }
  }
  throw new Error(`Cannot generate unique slug after ${MAX_ATTEMPTS} attempts`);
}
