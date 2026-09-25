import {
  fetchLeadsFromCampaign,
  fetchLeadsFromList,
  getInstantlyApiKey,
} from "@/lib/instantly";
import {
  createLinkTrackingClient,
  findLeadsByEmails,
} from "@/lib/legacy/link-tracking/supabase";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";
import {
  executeProvisionForSelectedLeads,
  needsInstantlyLeadResync,
  needsProvision,
  parseInstantlyLead,
  type ParsedLead,
} from "@/lib/legacy/link-tracking/provision-from-list-internals";

/** Active comptable intake list (TEMP - COMPTABLE). */
const DEFAULT_LIST_ID = "ca3e72d4-5a43-4399-a89b-566095e69c25";
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
    categoryRaw !== "cif" &&
    categoryRaw !== "comptable_delivery"
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
    comptableDeliverySegment: string | null;
    comptableDeliveryRouteSegment:
      | import("@/lib/legacy/admin/niches/comptable-delivery-verticals").ComptableDeliveryRouteSegment
      | null;
    fixedClientId: string | null;
    /** @deprecated */
    jumSegment: string | null;
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

  const fetchStart = Date.now();
  const allLeads = fromCampaign
    ? await fetchLeadsFromCampaign(apiKey, campaignId, {
        maxLeads: overrides.maxLeads ?? null,
      })
    : await fetchLeadsFromList(apiKey, listId, {
        maxLeads: overrides.maxLeads ?? null,
      });
  // #region agent log
  fetch("http://127.0.0.1:7790/ingest/40fdf837-56a3-4df2-be34-389f58aba2b9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "45a424",
    },
    body: JSON.stringify({
      sessionId: "45a424",
      hypothesisId: "H5",
      location: "provision-from-list.ts",
      message: "instantly fetch leads done",
      data: {
        fetchMs: Date.now() - fetchStart,
        fromCampaign,
        leadCount: allLeads.length,
        campaignId,
        listId,
      },
      timestamp: Date.now(),
      runId: process.env.PROVISION_DEBUG_RUN_ID?.trim() || "provision",
    }),
  }).catch(() => {});
  // #endregion

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
    const staleInstantlyId =
      fromCampaign &&
      needsInstantlyLeadResync(
        existing?.lead.instantly_lead_id,
        lead.instantlyLeadId,
      );
    if (
      resyncAll ||
      needsProvision(lead.email, lookup, category) ||
      staleInstantlyId
    ) {
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
    comptableDeliverySegment:
      overrides.comptableDeliverySegment ?? overrides.jumSegment ?? null,
    comptableDeliveryRouteSegment:
      overrides.comptableDeliveryRouteSegment ?? null,
    fixedClientId: overrides.fixedClientId ?? null,
    jumSegment: overrides.jumSegment ?? null,
  });

  return {
    ...result,
    ...executed,
  };
}
