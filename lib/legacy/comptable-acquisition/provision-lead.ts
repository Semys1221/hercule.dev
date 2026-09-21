import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { buildComptableLeadUrls, buildDashboardUrl } from "@/lib/legacy/link-tracking/urls";

export type ProvisionComptableAcquisitionLeadParams = {
  email: string;
  firstName?: string | null;
  company?: string | null;
};

export type ProvisionComptableAcquisitionLeadResult = {
  lead: LinkTrackingLead;
  created: boolean;
};

async function insertComptableLead(
  client: SupabaseClient,
  params: ProvisionComptableAcquisitionLeadParams,
  slug: string,
): Promise<LinkTrackingLead> {
  const email = normalizeEmail(params.email);
  const urls = buildComptableLeadUrls(slug, email);

  const row: Record<string, unknown> = {
    email,
    statut: "NOTBOOKED",
    slug,
    ...urls,
    dashboard_link: buildDashboardUrl(slug),
    instantly_lead_id: null,
    instantly_campaign_id: null,
    first_name: params.firstName?.trim() || null,
    company: params.company?.trim() || null,
    calendly_questions: {},
    product_statut: "PAID_PENDING_ONBOARDING",
  };

  const { data, error } = await client.from("comptable").insert(row).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert comptable lead");
  }

  return data as LinkTrackingLead;
}

export async function ensureComptableAcquisitionLead(
  params: ProvisionComptableAcquisitionLeadParams,
): Promise<ProvisionComptableAcquisitionLeadResult> {
  const client = createLinkTrackingClient();
  const email = normalizeEmail(params.email);
  const existing = await findLeadByEmail(client, email);

  if (existing?.category === "comptable") {
    const { data, error } = await client
      .from("comptable")
      .update({
        product_statut: "PAID_PENDING_ONBOARDING",
        first_name: params.firstName?.trim() || existing.lead.first_name,
        company: params.company?.trim() || existing.lead.company,
      })
      .eq("id", existing.lead.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update comptable lead");
    }

    return { lead: data as LinkTrackingLead, created: false };
  }

  if (existing) {
    throw new Error(`email_exists_in_${existing.category}`);
  }

  const slugSet = await loadSlugSet(client);
  const [slug] = allocateSlugs(slugSet, 1);
  if (!slug) {
    throw new Error("failed_to_allocate_slug");
  }

  const lead = await insertComptableLead(client, params, slug);
  return { lead, created: true };
}
