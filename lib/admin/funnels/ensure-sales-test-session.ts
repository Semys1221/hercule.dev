import type { SupabaseClient } from "@supabase/supabase-js";

import { findLeadByLink } from "@/lib/link-tracking/supabase";
import type { LeadLookup } from "@/lib/link-tracking/types";

import { provisionTestMeeting } from "./provision-test-meeting";
import {
  isSalesTestSessionSlug,
  SALES_TEST_SESSION_COMPTABLE_SLUG,
} from "./sales-test-session-preset";

export async function ensureSalesTestSessionLead(
  client: SupabaseClient,
  slug: string,
): Promise<LeadLookup | null> {
  const normalizedSlug = slug.trim();
  const existing = await findLeadByLink(client, normalizedSlug);
  if (existing) {
    return existing;
  }

  if (!isSalesTestSessionSlug(normalizedSlug) || process.env.NODE_ENV === "production") {
    return null;
  }

  const audience =
    normalizedSlug === SALES_TEST_SESSION_COMPTABLE_SLUG ? "comptable" : "agence";
  await provisionTestMeeting(client, audience);
  return findLeadByLink(client, normalizedSlug);
}
