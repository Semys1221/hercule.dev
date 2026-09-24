import { campaignIdFromEnv } from "@/lib/legacy/admin/niches/outreach-config";
import {
  resolveComptableDeliveryVerticalByCampaignId,
  routeSegmentForComptableDeliverySegment,
} from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import { findLeadByEmailInCampaign, getInstantlyApiKey } from "@/lib/legacy/instantly-bypass/client";
import { patchLeadsCustomVariablesParallel } from "@/lib/instantly";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import { ALL_LEAD_CATEGORIES, isLeadCategory, type LeadCategory, type LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { readReservationLink } from "@/lib/legacy/instantly-bypass/reservation-links";
import {
  buildCifLeadUrls,
  buildComptableLeadUrls,
  buildDashboardUrl,
  buildEntrepriseLeadUrls,
  buildInstantlyCustomVariables,
  buildComptableDeliveryLeadUrls,
  buildLeadUrls,
  leadSlug,
} from "@/lib/legacy/link-tracking/urls";

export type EnsureCampaignLeadLinksResult =
  | { ok: true; reservationEntrepriseLink: string; created: boolean }
  | { ok: false; reason: string };

const KNOWN_CAMPAIGN_CATEGORY: Record<string, LeadCategory> = {
  "e4c58718-ca00-4e27-b714-68e522fe4db6": "comptable",
  "e3bdb573-fe9f-437d-bd96-4ceb52869dd4": "cif",
  "e4f11e76-717e-4be9-a6ad-c7f0a331afb7": "comptable_delivery",
  "05bc06f8-4f60-4e6c-bae1-7afe30df38c7": "comptable_delivery",
  "0f0b450a-e550-461c-96f6-1a7681678d67": "comptable_delivery",
  "5c142a13-fcdf-4d6d-92e7-2afbc1865a5a": "comptable_delivery",
  "581b9357-753e-4c6e-aa99-d8b36fefca2d": "comptable_delivery",
  "273473f0-b2f1-4462-a668-f0277f90d807": "comptable_delivery",
  "7ec0e211-9832-4baf-8803-e12ab93ee517": "comptable_delivery",
  "7300a1ce-9e55-4bfa-92fd-d25361a22a59": "comptable_delivery",
};

export async function resolveCategoryForCampaign(
  campaignId: string,
): Promise<LeadCategory | null> {
  const known = KNOWN_CAMPAIGN_CATEGORY[campaignId];
  if (known) {
    return known;
  }

  const deliveryVertical =
    resolveComptableDeliveryVerticalByCampaignId(campaignId);
  if (deliveryVertical) {
    return "comptable_delivery";
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("niche_outreach_config")
    .select("niche")
    .eq("instantly_campaign_id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve niche for campaign: ${error.message}`);
  }

  const niche = data?.niche;
  if (typeof niche === "string" && isLeadCategory(niche)) {
    return niche;
  }

  for (const candidate of ALL_LEAD_CATEGORIES) {
    if (campaignIdFromEnv(candidate) === campaignId) {
      return candidate;
    }
  }

  return null;
}

function urlFieldsForCategory(
  category: LeadCategory,
  slug: string,
  email: string,
  campaignId?: string,
): Record<string, string> {
  if (category === "comptable") {
    return buildComptableLeadUrls(slug, email);
  }
  if (category === "cif") {
    return buildCifLeadUrls(slug, email);
  }
  if (category === "comptable_delivery") {
    const vertical = campaignId
      ? resolveComptableDeliveryVerticalByCampaignId(campaignId)
      : null;
    const routeSegment = vertical
      ? vertical.routeSegment
      : routeSegmentForComptableDeliverySegment(null);
    return buildComptableDeliveryLeadUrls(slug, email, routeSegment);
  }
  if (category === "entreprise") {
    return buildEntrepriseLeadUrls(slug, email);
  }
  return buildLeadUrls(slug, email);
}

function comptableDeliveryProfileForCampaign(
  campaignId: string,
): Record<string, string> | undefined {
  const vertical = resolveComptableDeliveryVerticalByCampaignId(campaignId);
  if (!vertical) return undefined;
  return {
    segment: vertical.segment,
    jum_segment: vertical.segment,
    comptable_delivery_segment: vertical.segment,
  };
}

/** Provision link-tracking row + Instantly custom vars for one campaign lead. */
export async function ensureCampaignLeadLinks(params: {
  campaignId: string;
  leadEmail: string;
  category?: LeadCategory;
}): Promise<EnsureCampaignLeadLinksResult> {
  const campaignId = params.campaignId.trim();
  const email = normalizeEmail(params.leadEmail);
  if (!campaignId || !email) {
    return { ok: false, reason: "missing_campaign_or_email" };
  }

  const category =
    params.category ?? (await resolveCategoryForCampaign(campaignId));
  if (!category) {
    return { ok: false, reason: "unknown_campaign_category" };
  }

  const apiKey = getInstantlyApiKey();
  const instantlyLead = await findLeadByEmailInCampaign(apiKey, campaignId, email);
  if (!instantlyLead?.id) {
    return { ok: false, reason: "lead_not_in_campaign" };
  }

  const client = createLinkTrackingClient();
  const existing = await findLeadByEmail(client, email);
  if (existing && existing.category !== category) {
    return {
      ok: false,
      reason: `email_exists_in_${existing.category}`,
    };
  }

  const deliveryProfile =
    category === "comptable_delivery"
      ? comptableDeliveryProfileForCampaign(campaignId)
      : undefined;
  const deliverySegment = deliveryProfile?.comptable_delivery_segment ?? null;
  const deliveryVertical =
    category === "comptable_delivery"
      ? resolveComptableDeliveryVerticalByCampaignId(campaignId)
      : null;

  let dbRow: LinkTrackingLead | null = existing?.lead ?? null;
  let created = false;

  if (!dbRow) {
    const slugSet = await loadSlugSet(client);
    const [slug] = allocateSlugs(slugSet, 1);
    if (!slug) {
      return { ok: false, reason: "slug_allocation_failed" };
    }

    const urls = urlFieldsForCategory(category, slug, email, campaignId);
    const { data, error } = await client
      .from(category)
      .insert({
        email,
        statut: "NOTBOOKED",
        slug,
        ...urls,
        dashboard_link: buildDashboardUrl(slug),
        instantly_lead_id: instantlyLead.id,
        instantly_campaign_id: campaignId,
        first_name: String(instantlyLead.first_name ?? "").trim() || null,
        company: String(instantlyLead.company_name ?? "").trim() || null,
        calendly_questions: {},
        ...(deliveryProfile ? { profile: deliveryProfile } : {}),
      })
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        reason: `insert_failed:${error?.message ?? "no_row"}`,
      };
    }
    dbRow = data as LinkTrackingLead;
    created = true;
  } else {
    const slug = leadSlug(dbRow);
    if (!slug) {
      return { ok: false, reason: "existing_row_missing_slug" };
    }

    const urls = urlFieldsForCategory(category, slug, email, campaignId);
    const { data, error } = await client
      .from(category)
      .update({
        ...urls,
        dashboard_link: dbRow.dashboard_link?.trim() || buildDashboardUrl(slug),
        instantly_lead_id: instantlyLead.id,
        instantly_campaign_id: campaignId,
        ...(deliveryProfile
          ? { profile: { ...(dbRow.profile ?? {}), ...deliveryProfile } }
          : {}),
      })
      .eq("id", dbRow.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        reason: `update_failed:${error?.message ?? "no_row"}`,
      };
    }
    dbRow = data as LinkTrackingLead;
  }

  const slug = leadSlug(dbRow);
  if (!slug) {
    return { ok: false, reason: "missing_slug_after_provision" };
  }

  const customVariables = buildInstantlyCustomVariables(
    slug,
    email,
    dbRow.statut ?? "NOTBOOKED",
    category,
    category === "comptable_delivery"
      ? {
          comptableDeliverySegment:
            deliverySegment ||
            (typeof dbRow.profile?.segment === "string"
              ? dbRow.profile.segment
              : null),
          comptableDeliveryRouteSegment: deliveryVertical?.routeSegment ?? null,
          jumSegment: deliverySegment,
        }
      : undefined,
  );

  const patchStats = await patchLeadsCustomVariablesParallel(apiKey, [
    {
      leadId: instantlyLead.id,
      customVariables,
    },
  ]);

  if (patchStats.failed > 0 || patchStats.patched === 0) {
    return {
      ok: false,
      reason: patchStats.errors[0] ?? "instantly_patch_failed",
    };
  }

  const reservationLink = readReservationLink(
    { payload: customVariables },
    customVariables,
  );
  if (!reservationLink) {
    return { ok: false, reason: "reservation_link_empty_after_patch" };
  }

  return { ok: true, reservationEntrepriseLink: reservationLink, created };
}
