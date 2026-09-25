import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import {
  mapLeadsRowToLinkTracking,
  mapPatchToLeadsRow,
  outreachInsertRow,
} from "@/lib/legacy/link-tracking/leads-table";
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
  const existing = await findLeadByEmail(client, email);

  if (existing?.category === "comptable") {
    const firstName =
      params.firstName?.trim() ||
      existing.lead.first_name?.trim() ||
      firstNameFromEmail(email);

    const { data, error } = await client
      .from("leads")
      .update(
        mapPatchToLeadsRow("comptable", {
          first_name: firstName || existing.lead.first_name,
          company: params.company?.trim() || existing.lead.company,
        }),
      )
      .eq("category", "comptable")
      .eq("id", existing.lead.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update comptable lead");
    }

    return {
      lead: mapLeadsRowToLinkTracking("comptable", data as Record<string, unknown>),
      created: false,
    };
  }

  if (existing) {
    throw new Error(`email_exists_in_${existing.category}`);
  }

  const slugSet = await loadSlugSet(client);
  const [slug] = allocateSlugs(slugSet, 1);
  if (!slug) {
    throw new Error("slug_allocation_failed");
  }

  const urls = buildComptableLeadUrls(slug, email);
  const firstName = params.firstName?.trim() || firstNameFromEmail(email);

  const { data, error } = await client
    .from("leads")
    .insert(
      outreachInsertRow("comptable", {
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
      }),
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert comptable lead");
  }

  return {
    lead: mapLeadsRowToLinkTracking("comptable", data as Record<string, unknown>),
    created: true,
  };
}
