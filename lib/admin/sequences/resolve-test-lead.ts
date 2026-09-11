import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

function testLeadIdFromEnv(category: LeadCategory): string | null {
  if (category === "agence") {
    return process.env.SEQUENCE_TEST_LEAD_ID_AGENCE?.trim() || null;
  }
  if (category === "comptable") {
    return process.env.SEQUENCE_TEST_LEAD_ID_COMPTABLE?.trim() || null;
  }
  if (category === "cif") {
    return process.env.SEQUENCE_TEST_LEAD_ID_CIF?.trim() || null;
  }
  if (category === "entreprise") {
    return process.env.SEQUENCE_TEST_LEAD_ID_ENTREPRISE?.trim() || null;
  }
  return null;
}

async function firstLeadIdForCategory(category: LeadCategory): Promise<string | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from(category)
    .select("id")
    .not("email", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as { id: string } | null)?.id ?? null;
}

/** Resolve a fixture lead for sequence test sends (Historique job row FK). */
export async function resolveTestLeadForCategory(category: LeadCategory) {
  const client = createLinkTrackingClient();
  const fromEnv = testLeadIdFromEnv(category);
  if (fromEnv) {
    const lead = await findLeadById(client, category, fromEnv);
    if (lead) {
      return lead;
    }
  }

  const fallbackId = await firstLeadIdForCategory(category);
  if (!fallbackId) {
    return null;
  }

  return findLeadById(client, category, fallbackId);
}
