import {
  fetchLeadsFromCampaign,
  fetchLeadsFromList,
  getInstantlyApiKey,
  patchLeadsCustomVariablesParallel,
  type InstantlyListLead,
} from "@/lib/instantly";
import { findLeadByEmailInCampaign } from "@/lib/instantly-bypass/client";
import {
  createLinkTrackingClient,
  findLeadsByEmails,
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

/** Active comptable intake list (Cabinets EC vol throughput recovery). */
const DEFAULT_LIST_ID = "bfb0fc90-ec59-4d49-b266-3891f59d3ea8";
/** Legacy list kept for dedup / historical rows. */
export const LEGACY_COMPTABLE_LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c";
const DEFAULT_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6";
const DEFAULT_CATEGORY: LeadCategory = "comptable";
const INSERT_BATCH_SIZE = 100;
const PATCH_CONCURRENCY = Number.parseInt(
  process.env.INSTANTLY_PATCH_CONCURRENCY?.trim() ?? "8",
  10,
);

export type ProvisionFromListResult = {
  listId: string;
  campaignId: string;
  category: LeadCategory;
  totalInList: number;
  selected: number;
  skippedWrongCategory: number;
  created: number;
  updated: number;
  patched: number;
  failed: number;
  errors: string[];
  resyncAll?: boolean;
};

type ParsedLead = {
  email: string;
  instantlyLeadId: string;
  firstName: string | null;
  companyName: string | null;
  source: InstantlyListLead;
};

function readConfig(): {
  listId: string;
  campaignId: string;
  category: LeadCategory;
} {
  const listId =
    process.env.LINK_PROVISIONING_LIST_ID?.trim() || DEFAULT_LIST_ID;
  const campaignId =
    process.env.LINK_PROVISIONING_CAMPAIGN_ID?.trim() || DEFAULT_CAMPAIGN_ID;
  const categoryRaw =
    process.env.LINK_PROVISIONING_CATEGORY?.trim() || DEFAULT_CATEGORY;
  if (categoryRaw !== "agence" && categoryRaw !== "comptable" && categoryRaw !== "entreprise") {
    throw new Error(`Invalid LINK_PROVISIONING_CATEGORY: ${categoryRaw}`);
  }
  return { listId, campaignId, category: categoryRaw };
}

function parseInstantlyLead(lead: InstantlyListLead): ParsedLead | null {
  const email = normalizeEmail(String(lead.email ?? ""));
  const instantlyLeadId = String(lead.id ?? "").trim();
  if (!email || !email.includes("@")) return null;
  return {
    email,
    instantlyLeadId,
    firstName: String(lead.first_name ?? "").trim() || null,
    companyName: String(lead.company_name ?? "").trim() || null,
    source: lead,
  };
}

async function attachCampaignLeadIds(
  apiKey: string,
  campaignId: string,
  leads: ParsedLead[],
): Promise<ParsedLead[]> {
  const concurrency = Number.isFinite(PATCH_CONCURRENCY) ? PATCH_CONCURRENCY : 8;
  const enriched = new Array<ParsedLead>(leads.length);

  for (let start = 0; start < leads.length; start += concurrency) {
    const chunk = leads.slice(start, start + concurrency);
    const resolved = await Promise.all(
      chunk.map(async (lead, index) => {
        const campaignLead = await findLeadByEmailInCampaign(
          apiKey,
          campaignId,
          lead.email,
        );
        const campaignLeadId = campaignLead?.id?.trim();
        return {
          index: start + index,
          lead: campaignLeadId
            ? { ...lead, instantlyLeadId: campaignLeadId }
            : lead,
        };
      }),
    );
    for (const item of resolved) {
      enriched[item.index] = item.lead;
    }
  }

  return enriched;
}

function urlFieldsForCategory(
  category: LeadCategory,
  slug: string,
  email: string,
): Record<string, string> {
  if (category === "comptable") {
    return buildComptableLeadUrls(slug, email);
  }
  return category === "entreprise"
    ? buildEntrepriseLeadUrls(slug, email)
    : buildLeadUrls(slug, email);
}

function needsProvision(
  email: string,
  lookup: Map<string, { category: LeadCategory; lead: LinkTrackingLead }>,
  category: LeadCategory,
): boolean {
  const existing = lookup.get(email);
  if (!existing) return true;
  if (existing.category !== category) return false;
  const row = existing.lead;
  const slug = leadSlug(row);
  if (category === "comptable") {
    const reservationLink = row.reservation_comptable_link?.trim();
    const confirmLink = row.confirmation_comptable_link?.trim();
    return !slug || !reservationLink || !confirmLink;
  }
  const entrepriseLink = row.reservation_entreprise_link?.trim();
  const confirmLink = row.confirmation_agence_link?.trim();
  const postBookingLink =
    category === "entreprise" ? row.post_booking_link?.trim() : "ok";
  return !slug || !entrepriseLink || !confirmLink || !postBookingLink;
}

function buildRefreshPatch(
  lead: LinkTrackingLead,
  slug: string,
  category: LeadCategory,
  campaignId: string,
  instantlyLeadId: string | null,
): Record<string, unknown> {
  const urls = urlFieldsForCategory(category, slug, lead.email);
  return {
    ...urls,
    dashboard_link: lead.dashboard_link?.trim() || buildDashboardUrl(slug),
    instantly_lead_id: instantlyLeadId || lead.instantly_lead_id,
    instantly_campaign_id: campaignId,
  };
}

export async function provisionLinksFromList(
  overrides: Partial<{
    listId: string;
    campaignId: string;
    category: LeadCategory;
    maxLeads: number | null;
    resyncAll: boolean;
    fromCampaign: boolean;
  }> = {},
): Promise<ProvisionFromListResult> {
  const config = readConfig();
  const listId = overrides.listId ?? config.listId;
  const campaignId = overrides.campaignId ?? config.campaignId;
  const category = overrides.category ?? config.category;
  const resyncAll = overrides.resyncAll ?? false;
  const fromCampaign = overrides.fromCampaign ?? false;
  const apiKey = getInstantlyApiKey();
  const client = createLinkTrackingClient();

  const allLeads = fromCampaign
    ? await fetchLeadsFromCampaign(apiKey, campaignId, {
        maxLeads: overrides.maxLeads ?? null,
      })
    : await fetchLeadsFromList(apiKey, listId, {
        maxLeads: overrides.maxLeads ?? null,
      });

  const parsed = allLeads
    .map(parseInstantlyLead)
    .filter((lead): lead is ParsedLead => lead !== null);

  const emails = parsed.map((lead) => lead.email);
  const lookup = await findLeadsByEmails(client, emails);

  let selected: ParsedLead[] = [];
  let skippedWrongCategory = 0;

  for (const lead of parsed) {
    const existing = lookup.get(lead.email);
    if (existing && existing.category !== category) {
      skippedWrongCategory += 1;
      continue;
    }
    if (resyncAll || needsProvision(lead.email, lookup, category)) {
      selected.push(lead);
    }
  }

  const result: ProvisionFromListResult = {
    listId,
    campaignId,
    category,
    totalInList: parsed.length,
    selected: selected.length,
    skippedWrongCategory,
    created: 0,
    updated: 0,
    patched: 0,
    failed: 0,
    errors: [],
    resyncAll,
  };

  if (selected.length === 0) {
    return result;
  }

  if (!fromCampaign) {
    selected = await attachCampaignLeadIds(apiKey, campaignId, selected);
  }

  const slugSet = await loadSlugSet(client);
  const toCreate = selected.filter((lead) => !lookup.has(lead.email));
  const toUpdate = selected.filter((lead) => lookup.has(lead.email));

  const dbRowsByEmail = new Map<string, LinkTrackingLead>();

  if (toCreate.length > 0) {
    const newSlugs = allocateSlugs(slugSet, toCreate.length);
    for (let start = 0; start < toCreate.length; start += INSERT_BATCH_SIZE) {
      const chunk = toCreate.slice(start, start + INSERT_BATCH_SIZE);
      const rows = chunk.map((lead, index) => {
        const slug = newSlugs[start + index] ?? newSlugs[index];
        const urls = urlFieldsForCategory(category, slug, lead.email);
        return {
          email: lead.email,
          statut: "NOTBOOKED",
          slug,
          ...urls,
          dashboard_link: buildDashboardUrl(slug),
          instantly_lead_id: lead.instantlyLeadId || null,
          instantly_campaign_id: campaignId,
          first_name: lead.firstName,
          company: lead.companyName,
          calendly_questions: {},
        };
      });

      const { data, error } = await client.from(category).insert(rows).select("*");
      if (error) {
        result.failed += chunk.length;
        result.errors.push(`Supabase insert failed: ${error.message}`);
      } else {
        result.created += data?.length ?? 0;
        for (const row of (data ?? []) as LinkTrackingLead[]) {
          dbRowsByEmail.set(normalizeEmail(row.email), row);
        }
      }
    }
  }

  for (const lead of toUpdate) {
    const existing = lookup.get(lead.email);
    if (!existing) continue;
    const slug = leadSlug(existing.lead);
    if (!slug) {
      result.failed += 1;
      result.errors.push(`${lead.email}: missing slug on existing row`);
      continue;
    }

    const patch = buildRefreshPatch(
      existing.lead,
      slug,
      category,
      campaignId,
      lead.instantlyLeadId || null,
    );
    const { data, error } = await client
      .from(category)
      .update(patch)
      .eq("id", existing.lead.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      result.failed += 1;
      result.errors.push(
        `${lead.email}: update failed (${error?.message ?? "no row"})`,
      );
      continue;
    }

    result.updated += 1;
    dbRowsByEmail.set(lead.email, data as LinkTrackingLead);
  }

  const patchItems: Array<{ leadId: string; customVariables: Record<string, string> }> =
    [];

  for (const lead of selected) {
    const dbRow =
      dbRowsByEmail.get(lead.email) ?? lookup.get(lead.email)?.lead ?? null;
    if (!dbRow || !lead.instantlyLeadId) continue;
    const slug = leadSlug(dbRow);
    if (!slug) continue;
    patchItems.push({
      leadId: lead.instantlyLeadId,
      customVariables: buildInstantlyCustomVariables(
        slug,
        lead.email,
        dbRow.statut ?? "NOTBOOKED",
        category,
      ),
    });
  }

  if (patchItems.length > 0) {
    const patchStats = await patchLeadsCustomVariablesParallel(
      apiKey,
      patchItems,
      Number.isFinite(PATCH_CONCURRENCY) ? PATCH_CONCURRENCY : 8,
    );
    result.patched = patchStats.patched;
    result.failed += patchStats.failed;
    result.errors.push(...patchStats.errors.slice(0, 10));
  }

  return result;
}
