import { assignClientsForProvision } from "@/lib/clients/round-robin";
import {
  getInstantlyApiKey,
  patchLeadsCustomVariablesParallel,
  type InstantlyListLead,
} from "@/lib/instantly";
import { findLeadByEmailInCampaign } from "@/lib/legacy/instantly-bypass/client";
import {
  createLinkTrackingClient,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import type { ComptableDeliveryRouteSegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import { routeSegmentForComptableDeliverySegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import {
  mapLeadsRowToLinkTracking,
  mapPatchToLeadsRow,
  outreachInsertRow,
} from "@/lib/legacy/link-tracking/leads-table";
import {
  tableForLeadCategory,
  type LeadCategory,
  type LinkTrackingLead,
} from "@/lib/legacy/link-tracking/types";
import {
  buildCifLeadUrls,
  buildComptableDeliveryLeadUrls,
  buildComptableLeadUrls,
  buildDashboardUrl,
  buildEntrepriseLeadUrls,
  buildInstantlyCustomVariables,
  buildLeadUrls,
  isCanonicalReservationUrl,
  leadSlug,
} from "@/lib/legacy/link-tracking/urls";

const INSERT_BATCH_SIZE = 100;
const PATCH_CONCURRENCY = Number.parseInt(
  process.env.INSTANTLY_PATCH_CONCURRENCY?.trim() ?? "32",
  10,
);
const UPDATE_CONCURRENCY = Number.parseInt(
  process.env.PROVISION_UPDATE_CONCURRENCY?.trim() ?? "20",
  10,
);
const LOG_CUSTOM_VARS =
  process.env.PROVISION_LOG_CUSTOM_VARS?.trim() === "1";

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const workers = Math.max(
    1,
    Math.min(concurrency, items.length, 64),
  );
  let index = 0;
  async function runWorker(): Promise<void> {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      if (current === undefined) continue;
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: workers }, () => runWorker()));
}

// #region agent log
function provisionDebugLog(
  hypothesisId: string,
  message: string,
  data: Record<string, unknown>,
): void {
  fetch("http://127.0.0.1:7790/ingest/40fdf837-56a3-4df2-be34-389f58aba2b9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "45a424",
    },
    body: JSON.stringify({
      sessionId: "45a424",
      hypothesisId,
      location: "provision-from-list-internals.ts",
      message,
      data,
      timestamp: Date.now(),
      runId: process.env.PROVISION_DEBUG_RUN_ID?.trim() || "provision",
    }),
  }).catch(() => {});
}
// #endregion

export type ParsedLead = {
  email: string;
  instantlyLeadId: string;
  firstName: string | null;
  companyName: string | null;
  source: InstantlyListLead;
};

export function parseInstantlyLead(lead: InstantlyListLead): ParsedLead | null {
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

export function urlFieldsForCategory(
  category: LeadCategory,
  slug: string,
  email: string,
  options?: {
    comptableDeliveryRouteSegment?: ComptableDeliveryRouteSegment;
  },
): Record<string, string> {
  if (category === "comptable") {
    return buildComptableLeadUrls(slug, email);
  }
  if (category === "cif") {
    return buildCifLeadUrls(slug, email);
  }
  if (category === "comptable_delivery") {
    const routeSegment =
      options?.comptableDeliveryRouteSegment ?? "restaurant";
    return buildComptableDeliveryLeadUrls(slug, email, routeSegment);
  }
  if (category === "client") {
    return {
      dashboard_link: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.hercule.dev"}/clients/${slug}`,
    };
  }
  return category === "entreprise"
    ? buildEntrepriseLeadUrls(slug, email)
    : buildLeadUrls(slug, email);
}

/** True when Supabase points at a different Instantly row than the live campaign lead. */
export function needsInstantlyLeadResync(
  storedLeadId: string | null | undefined,
  currentLeadId: string | null | undefined,
): boolean {
  const current = String(currentLeadId ?? "").trim();
  if (!current) return false;
  const stored = String(storedLeadId ?? "").trim();
  return !stored || stored !== current;
}

export function needsProvision(
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
    if (!slug || !reservationLink || !confirmLink) return true;
    if (isCanonicalReservationUrl(reservationLink)) return false;
    return reservationLink.includes("reservation-entreprise.html");
  }
  if (category === "cif") {
    const reservationLink = row.reservation_cif_link?.trim();
    if (!slug || !reservationLink) return true;
    if (isCanonicalReservationUrl(reservationLink)) return false;
    return reservationLink.includes("reservation-cif.html");
  }
  if (category === "comptable_delivery") {
    const reservationLink = row.reservation_comptable_delivery_link?.trim();
    const confirmLink = row.confirmation_comptable_delivery_link?.trim();
    if (!slug || !reservationLink || !confirmLink) return true;
    if (isCanonicalReservationUrl(reservationLink)) return false;
    return (
      reservationLink.includes("reservation-jum.html") ||
      !reservationLink.includes("/reservation/")
    );
  }
  const entrepriseLink = row.reservation_entreprise_link?.trim();
  const confirmLink = row.confirmation_agence_link?.trim();
  const postBookingLink =
    category === "entreprise" ? row.post_booking_link?.trim() : "ok";
  return !slug || !entrepriseLink || !confirmLink || !postBookingLink;
}

export function buildRefreshPatch(
  lead: LinkTrackingLead,
  slug: string,
  category: LeadCategory,
  campaignId: string,
  instantlyLeadId: string | null,
  options?: {
    comptableDeliveryRouteSegment?: ComptableDeliveryRouteSegment;
  },
): Record<string, unknown> {
  const urls = urlFieldsForCategory(category, slug, lead.email, options);
  return {
    ...urls,
    dashboard_link: lead.dashboard_link?.trim() || buildDashboardUrl(slug),
    instantly_lead_id: instantlyLeadId || lead.instantly_lead_id,
    instantly_campaign_id: campaignId,
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
        const existingId = lead.instantlyLeadId?.trim();
        if (existingId) {
          return { index: start + index, lead };
        }
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

export async function executeProvisionForSelectedLeads(params: {
  selected: ParsedLead[];
  lookup: Map<string, { category: LeadCategory; lead: LinkTrackingLead }>;
  campaignId: string;
  category: LeadCategory;
  fromCampaign: boolean;
  comptableDeliverySegment?: string | null;
  /** @deprecated */
  jumSegment?: string | null;
  comptableDeliveryRouteSegment?: ComptableDeliveryRouteSegment | null;
  fixedClientId?: string | null;
}): Promise<{
  created: number;
  updated: number;
  patched: number;
  failed: number;
  errors: string[];
  customVariablesByEmail: Record<string, Record<string, string>>;
}> {
  const {
    lookup,
    campaignId,
    category,
    fromCampaign,
    fixedClientId,
  } = params;
  const comptableDeliverySegment =
    params.comptableDeliverySegment?.trim() ||
    params.jumSegment?.trim() ||
    null;
  const comptableDeliveryRouteSegment =
    params.comptableDeliveryRouteSegment ??
    (comptableDeliverySegment
      ? routeSegmentForComptableDeliverySegment(comptableDeliverySegment)
      : "restaurant");
  let selected = params.selected;
  const apiKey = getInstantlyApiKey();
  const client = createLinkTrackingClient();
  const result = {
    created: 0,
    updated: 0,
    patched: 0,
    failed: 0,
    errors: [] as string[],
    customVariablesByEmail: {} as Record<string, Record<string, string>>,
  };

  if (selected.length === 0) {
    return result;
  }

  const wallStart = Date.now();
  // #region agent log
  provisionDebugLog("H5", "executeProvision start", {
    selectedCount: selected.length,
    fromCampaign,
    patchConcurrency: PATCH_CONCURRENCY,
    updateConcurrency: UPDATE_CONCURRENCY,
  });
  // #endregion

  let attachMs = 0;
  if (!fromCampaign) {
    const attachStart = Date.now();
    selected = await attachCampaignLeadIds(apiKey, campaignId, selected);
    attachMs = Date.now() - attachStart;
    // #region agent log
    provisionDebugLog("H3", "attachCampaignLeadIds done", {
      attachMs,
      leadCount: selected.length,
    });
    // #endregion
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
        const urls = urlFieldsForCategory(category, slug, lead.email, {
          comptableDeliveryRouteSegment,
        });
        const profile =
          category === "comptable_delivery" && comptableDeliverySegment
            ? {
                segment: comptableDeliverySegment,
                jum_segment: comptableDeliverySegment,
                comptable_delivery_segment: comptableDeliverySegment,
              }
            : {};
        const legacyRow = {
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
          profile,
          ...(fixedClientId?.trim() ? { client_id: fixedClientId.trim() } : {}),
        };
        if (
          category === "comptable" ||
          category === "cif" ||
          category === "comptable_delivery"
        ) {
          return outreachInsertRow(category, legacyRow);
        }
        return legacyRow;
      });

      const table = tableForLeadCategory(category);
      const { data, error } = await client.from(table).insert(rows).select("*");
      if (error) {
        result.failed += chunk.length;
        result.errors.push(`Supabase insert failed: ${error.message}`);
      } else {
        result.created += data?.length ?? 0;
        for (const row of data ?? []) {
          const mapped = mapLeadsRowToLinkTracking(
            category,
            row as Record<string, unknown>,
          );
          dbRowsByEmail.set(normalizeEmail(mapped.email), mapped);
        }
      }
    }
  }

  const updateStart = Date.now();
  const updateConcurrency = Number.isFinite(UPDATE_CONCURRENCY)
    ? UPDATE_CONCURRENCY
    : 32;
  await runWithConcurrency(toUpdate, updateConcurrency, async (lead) => {
    const existing = lookup.get(lead.email);
    if (!existing) return;
    const slug = leadSlug(existing.lead);
    if (!slug) {
      result.failed += 1;
      result.errors.push(`${lead.email}: missing slug on existing row`);
      return;
    }

    const rawPatch = {
      ...buildRefreshPatch(
        existing.lead,
        slug,
        category,
        campaignId,
        lead.instantlyLeadId || null,
        { comptableDeliveryRouteSegment },
      ),
      ...(fixedClientId?.trim() ? { client_id: fixedClientId.trim() } : {}),
    };
    const patch = mapPatchToLeadsRow(category, rawPatch);
    const table = tableForLeadCategory(category);
    let data: LinkTrackingLead | null = null;
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let query = client
        .from(table)
        .update(patch)
        .eq("id", existing.lead.id);
      if (category !== "client") {
        query = query.eq("category", category);
      }
      const response = await query.select("*").maybeSingle();
      if (!response.error && response.data) {
        data = mapLeadsRowToLinkTracking(
          category,
          response.data as Record<string, unknown>,
        );
        break;
      }
      lastError = response.error?.message ?? "no row";
      const retryable = lastError.toLowerCase().includes("schema cache");
      if (!retryable || attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }

    if (!data) {
      result.failed += 1;
      result.errors.push(`${lead.email}: update failed (${lastError})`);
      return;
    }

    result.updated += 1;
    dbRowsByEmail.set(lead.email, data);
  });
  const updateMs = Date.now() - updateStart;
  // #region agent log
  provisionDebugLog("H1", "supabase update loop done", {
    updateMs,
    toUpdateCount: toUpdate.length,
    updated: result.updated,
    msPerRow: toUpdate.length > 0 ? updateMs / toUpdate.length : 0,
  });
  // #endregion

  const needingAssign: string[] = [];
  for (const row of dbRowsByEmail.values()) {
    if (!row.client_id?.trim()) {
      needingAssign.push(row.id);
    }
  }
  if (needingAssign.length > 0 && fixedClientId?.trim()) {
    let assignQuery = client
      .from(tableForLeadCategory(category))
      .update({ client_id: fixedClientId.trim() })
      .in("id", needingAssign);
    if (category !== "client") {
      assignQuery = assignQuery.eq("category", category);
    }
    const { error } = await assignQuery;
    if (error) {
      result.errors.push(`Fixed client assign failed: ${error.message}`);
    } else {
      for (const [email, row] of dbRowsByEmail) {
        if (needingAssign.includes(row.id)) {
          dbRowsByEmail.set(email, {
            ...row,
            client_id: fixedClientId.trim(),
          });
        }
      }
    }
  } else if (needingAssign.length > 0) {
    const assigned = await assignClientsForProvision({
      supabase: client,
      category,
      leadIdsNeedingAssign: needingAssign,
    });
    for (const [leadId, clientId] of assigned) {
      for (const [email, row] of dbRowsByEmail) {
        if (row.id === leadId) {
          dbRowsByEmail.set(email, { ...row, client_id: clientId });
        }
      }
    }
  }

  const patchItems: Array<{ leadId: string; customVariables: Record<string, string> }> =
    [];

  for (const lead of selected) {
    const dbRow =
      dbRowsByEmail.get(lead.email) ?? lookup.get(lead.email)?.lead ?? null;
    if (!dbRow) continue;
    const slug = leadSlug(dbRow);
    if (!slug) continue;
    const customVariables = buildInstantlyCustomVariables(
      slug,
      lead.email,
      dbRow.statut ?? "NOTBOOKED",
      category,
      category === "comptable_delivery"
        ? {
            comptableDeliverySegment:
              comptableDeliverySegment ||
              (typeof dbRow.profile?.comptable_delivery_segment === "string"
                ? dbRow.profile.comptable_delivery_segment
                : typeof dbRow.profile?.segment === "string"
                  ? dbRow.profile.segment
                  : null),
            comptableDeliveryRouteSegment,
            jumSegment: comptableDeliverySegment,
          }
        : undefined,
    );
    if (LOG_CUSTOM_VARS) {
      result.customVariablesByEmail[lead.email] = customVariables;
    }
    if (!lead.instantlyLeadId) continue;
    patchItems.push({
      leadId: lead.instantlyLeadId,
      customVariables,
    });
  }

  if (patchItems.length > 0) {
    const patchStart = Date.now();
    const patchStats = await patchLeadsCustomVariablesParallel(
      apiKey,
      patchItems,
      Number.isFinite(PATCH_CONCURRENCY) ? PATCH_CONCURRENCY : 8,
    );
    const patchMs = Date.now() - patchStart;
    // #region agent log
    provisionDebugLog("H2", "instantly patch done", {
      patchMs,
      patchItems: patchItems.length,
      patched: patchStats.patched,
      failed: patchStats.failed,
      msPerPatch: patchItems.length > 0 ? patchMs / patchItems.length : 0,
    });
    // #endregion
    result.patched = patchStats.patched;
    result.failed += patchStats.failed;
    result.errors.push(...patchStats.errors.slice(0, 10));
  }

  // #region agent log
  provisionDebugLog("H4", "executeProvision complete", {
    totalMs: Date.now() - wallStart,
    customVarsKeys: Object.keys(result.customVariablesByEmail).length,
    created: result.created,
    updated: result.updated,
    patched: result.patched,
  });
  // #endregion

  return result;
}
