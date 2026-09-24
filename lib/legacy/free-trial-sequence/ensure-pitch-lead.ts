import { createLinkTrackingClient, normalizeEmail } from "@/lib/legacy/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { buildComptableLeadUrls, buildDashboardUrl } from "@/lib/legacy/link-tracking/urls";

export type EnsureComptablePitchLeadParams = {
  email: string;
  firstName?: string | null;
  company?: string | null;
};

export type EnsureComptablePitchLeadResult = {
  lead: LinkTrackingLead;
  created: boolean;
};

function firstNameFromEmail(email: string): string | null {
  const local = email.split("@")[0]?.split(/[.+_-]/)[0]?.trim();
  if (!local || local.length < 2) return null;
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

export async function ensureComptablePitchLead(
  params: EnsureComptablePitchLeadParams,
): Promise<EnsureComptablePitchLeadResult> {
  const client = createLinkTrackingClient();
  const email = normalizeEmail(params.email);

  const { data: comptableRow } = await client
    .from("comptable")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (comptableRow) {
    const existing = comptableRow as LinkTrackingLead;
    const firstName =
      params.firstName?.trim() ||
      existing.first_name?.trim() ||
      firstNameFromEmail(email);

    const { data, error } = await client
      .from("comptable")
      .update({
        first_name: firstName || existing.first_name,
        company: params.company?.trim() || existing.company,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update comptable lead");
    }

    return { lead: data as LinkTrackingLead, created: false };
  }

  const slugSet = await loadSlugSet(client);
  const [slug] = allocateSlugs(slugSet, 1);
  if (!slug) {
    throw new Error("slug_allocation_failed");
  }

  const urls = buildComptableLeadUrls(slug, email);
  const firstName = params.firstName?.trim() || firstNameFromEmail(email);

  const { data, error } = await client
    .from("comptable")
    .insert({
      email,
      statut: "NOTBOOKED",
      slug,
      ...urls,
      dashboard_link: buildDashboardUrl(slug),
      instantly_lead_id: null,
      instantly_campaign_id: null,
      first_name: firstName,
      company: params.company?.trim() || null,
      calendly_questions: {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert comptable lead");
  }

  return { lead: data as LinkTrackingLead, created: true };
}
