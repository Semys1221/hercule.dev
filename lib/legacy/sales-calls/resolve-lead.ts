import type { SupabaseClient } from "@supabase/supabase-js";

import { isLeadCategory, type LeadCategory } from "@/lib/legacy/link-tracking/types";

import type { SalesCall } from "./types";

export type ResolvedSalesCallLead = {
  leadId: string;
  category: LeadCategory;
};

export async function resolveSalesCallLead(
  client: SupabaseClient,
  salesCall: SalesCall,
): Promise<ResolvedSalesCallLead | null> {
  if (!salesCall.lead_id) {
    return null;
  }

  const { data, error } = await client
    .from("leads")
    .select("category")
    .eq("id", salesCall.lead_id)
    .maybeSingle();

  if (error) {
    throw new Error(`resolveSalesCallLead failed: ${error.message}`);
  }

  const category = String(data?.category ?? "");
  if (!isLeadCategory(category) || category === "client") {
    return null;
  }

  return { leadId: salesCall.lead_id, category };
}

export function upsertIdsForLeadCategory(
  category: LeadCategory,
  leadId: string,
): { leadId: string } {
  void category;
  return { leadId };
}
