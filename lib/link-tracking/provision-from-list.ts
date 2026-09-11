import {
  fetchLeadsFromCampaign,
  fetchLeadsFromList,
  getInstantlyApiKey,
} from "@/lib/instantly";
import {
  createLinkTrackingClient,
  findLeadsByEmails,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";
import {
  executeProvisionForSelectedLeads,
  needsProvision,
  parseInstantlyLead,
  type ParsedLead,
} from "@/lib/link-tracking/provision-from-list-internals";

/** Active comptable intake list (Cabinets EC vol throughput recovery). */
const DEFAULT_LIST_ID = "bfb0fc90-ec59-4d49-b266-3891f59d3ea8";
/** Legacy list kept for dedup / historical rows. */
export const LEGACY_COMPTABLE_LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c";
const DEFAULT_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6";
const DEFAULT_CATEGORY: LeadCategory = "comptable";

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
  if (
    categoryRaw !== "agence" &&
    categoryRaw !== "comptable" &&
    categoryRaw !== "entreprise" &&
    categoryRaw !== "cif"
  ) {
    throw new Error(`Invalid LINK_PROVISIONING_CATEGORY: ${categoryRaw}`);
  }
  return { listId, campaignId, category: categoryRaw };
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

  const executed = await executeProvisionForSelectedLeads({
    selected,
    lookup,
    campaignId,
    category,
    fromCampaign,
  });

  return {
    ...result,
    ...executed,
  };
}
