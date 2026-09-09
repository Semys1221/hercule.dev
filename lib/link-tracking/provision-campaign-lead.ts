import { campaignIdFromEnv } from "@/lib/admin/niches/outreach-config";
import { findLeadByEmailInCampaign, getInstantlyApiKey } from "@/lib/instantly-bypass/client";
import { patchLeadsCustomVariablesParallel } from "@/lib/instantly";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/link-tracking/slug";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";
import {
  buildComptableLeadUrls,
  buildDashboardUrl,
  buildEntrepriseLeadUrls,
  buildInstantlyCustomVariables,
  buildLeadUrls,
  leadSlug,
} from "@/lib/link-tracking/urls";

export type EnsureCampaignLeadLinksResult =
  | { ok: true; reservationEntrepriseLink: string; created: boolean }
  | { ok: false; reason: string };

const KNOWN_CAMPAIGN_CATEGORY: Record<string, LeadCategory> = {
  "e4c58718-ca00-4e27-b714-68e522fe4db6": "comptable",
};

async function resolveCategoryForCampaign(
  campaignId: string,
): Promise<LeadCategory | null> {
  const known = KNOWN_CAMPAIGN_CATEGORY[campaignId];
  if (known) {
    return known;
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
  if (niche === "agence" || niche === "comptable" || niche === "entreprise") {
    return niche;
  }

  for (const candidate of ["agence", "comptable", "entreprise"] as const) {
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
): Record<string, string> {
  if (category === "comptable") {
    return buildComptableLeadUrls(slug, email);
  }
  if (category === "entreprise") {
    return buildEntrepriseLeadUrls(slug, email);
  }
  return buildLeadUrls(slug, email);
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

  let dbRow: LinkTrackingLead | null = existing?.lead ?? null;
  let created = false;

  if (!dbRow) {
    const slugSet = await loadSlugSet(client);
    const [slug] = allocateSlugs(slugSet, 1);
    if (!slug) {
      return { ok: false, reason: "slug_allocation_failed" };
    }

    const urls = urlFieldsForCategory(category, slug, email);
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

    const urls = urlFieldsForCategory(category, slug, email);
    const { data, error } = await client
      .from(category)
      .update({
        ...urls,
        dashboard_link: dbRow.dashboard_link?.trim() || buildDashboardUrl(slug),
        instantly_lead_id: instantlyLead.id,
        instantly_campaign_id: campaignId,
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

  const reservationEntrepriseLink =
    customVariables.reservation_entreprise_link?.trim() ?? "";
  if (!reservationEntrepriseLink) {
    return { ok: false, reason: "reservation_link_empty_after_patch" };
  }

  return { ok: true, reservationEntrepriseLink, created };
}
