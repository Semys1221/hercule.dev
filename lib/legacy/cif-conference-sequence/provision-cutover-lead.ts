import {
  createLinkTrackingClient,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { buildCifLeadUrls, buildDashboardUrl } from "@/lib/legacy/link-tracking/urls";

export type EnsureCifLeadForConferenceCutoverParams = {
  email: string;
  firstName?: string | null;
  company?: string | null;
  dryRun?: boolean;
};

export type EnsureCifLeadForConferenceCutoverResult = {
  leadId: string;
  email: string;
  slug: string;
  created: boolean;
  updated: boolean;
  dryRun?: boolean;
};

export async function findCifLeadByEmail(
  email: string,
): Promise<LinkTrackingLead | null> {
  const client = createLinkTrackingClient();
  const normalized = normalizeEmail(email);

  const { data, error } = await client
    .from("cif")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(`CIF lookup failed for ${normalized}: ${error.message}`);
  }

  return (data as LinkTrackingLead | null) ?? null;
}

function conferenceUrlsForSlug(slug: string, email: string) {
  return {
    ...buildCifLeadUrls(slug, email),
    dashboard_link: buildDashboardUrl(slug),
  };
}

export async function ensureCifLeadForConferenceCutover(
  params: EnsureCifLeadForConferenceCutoverParams,
): Promise<EnsureCifLeadForConferenceCutoverResult> {
  const email = normalizeEmail(params.email);
  const existing = await findCifLeadByEmail(email);

  if (existing) {
    const slug = existing.slug?.trim();
    if (!slug) {
      throw new Error(`CIF lead ${email} exists but has no slug`);
    }

    const urls = conferenceUrlsForSlug(slug, email);
    const patch = {
      statut: "NOTBOOKED",
      reservation_cif_link: urls.reservation_cif_link,
      dashboard_link: urls.dashboard_link,
      ...(params.firstName?.trim() ? { first_name: params.firstName.trim() } : {}),
      ...(params.company?.trim() ? { company: params.company.trim() } : {}),
    };

    if (params.dryRun) {
      return {
        leadId: existing.id,
        email,
        slug,
        created: false,
        updated: true,
        dryRun: true,
      };
    }

    const client = createLinkTrackingClient();
    const { data, error } = await client
      .from("cif")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to update CIF lead ${email}: ${error?.message ?? "no row"}`,
      );
    }

    return {
      leadId: existing.id,
      email,
      slug,
      created: false,
      updated: true,
    };
  }

  const client = createLinkTrackingClient();
  const slugSet = await loadSlugSet(client);
  const [slug] = allocateSlugs(slugSet, 1);
  const urls = conferenceUrlsForSlug(slug, email);

  const row = {
    email,
    slug,
    statut: "NOTBOOKED",
    first_name: params.firstName?.trim() || null,
    company: params.company?.trim() || null,
    ...urls,
    calendly_questions: {},
  };

  if (params.dryRun) {
    return {
      leadId: `dry-run-${slug}`,
      email,
      slug,
      created: true,
      updated: false,
      dryRun: true,
    };
  }

  const { data: created, error } = await client
    .from("cif")
    .insert(row)
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(
      `Failed to create CIF lead ${email}: ${error?.message ?? "no row"}`,
    );
  }

  return {
    leadId: created.id,
    email,
    slug,
    created: true,
    updated: false,
  };
}
