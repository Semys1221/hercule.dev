import {
  findLeadByEmailInCampaign,
  findLeadByEmailInList,
} from "@/lib/instantly-bypass/client";
import { resolveJumVerticalByCampaignId } from "@/lib/admin/niches/jum-verticals";
import {
  createLinkTrackingClient,
  findLeadsByEmails,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { InstantlyListLead } from "@/lib/instantly";
import { getInstantlyApiKey } from "@/lib/instantly";

import {
  executeProvisionForSelectedLeads,
  needsInstantlyLeadResync,
  needsProvision,
  parseInstantlyLead,
  type ParsedLead,
} from "@/lib/link-tracking/provision-from-list-internals";
import { buildInstantlyCustomVariables, leadSlug } from "@/lib/link-tracking/urls";

const DEFAULT_MAX_BATCH = 100;

export type ProvisionLeadsByEmailsResult = {
  listId: string;
  campaignId: string;
  category: LeadCategory;
  requested: number;
  selected: number;
  skipped: number;
  skippedWrongCategory: number;
  created: number;
  updated: number;
  patched: number;
  failed: number;
  errors: string[];
  customVariablesByEmail: Record<string, Record<string, string>>;
};

/** Normalize, dedupe, and cap email batches for provision API calls. */
export function normalizeProvisionEmails(
  emails: string[],
  maxBatch = DEFAULT_MAX_BATCH,
): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of emails) {
    const email = normalizeEmail(String(raw ?? ""));
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    normalized.push(email);
    if (normalized.length >= maxBatch) break;
  }
  return normalized;
}

async function resolveListLead(
  apiKey: string,
  listId: string,
  campaignId: string,
  email: string,
): Promise<ParsedLead> {
  const listLead = await findLeadByEmailInList(apiKey, listId, email);
  if (listLead) {
    const parsed = parseInstantlyLead(listLead as InstantlyListLead);
    if (parsed) return parsed;
  }

  const campaignLead = await findLeadByEmailInCampaign(
    apiKey,
    campaignId,
    email,
  );
  if (campaignLead?.id) {
    return {
      email,
      instantlyLeadId: String(campaignLead.id).trim(),
      firstName: String(campaignLead.first_name ?? "").trim() || null,
      companyName: String(campaignLead.company_name ?? "").trim() || null,
      source: { email, ...campaignLead } as InstantlyListLead,
    };
  }

  return {
    email,
    instantlyLeadId: "",
    firstName: null,
    companyName: null,
    source: { email },
  };
}

export async function provisionLeadsByEmails(params: {
  emails: string[];
  listId: string;
  campaignId: string;
  category: LeadCategory;
  jumSegment?: string | null;
}): Promise<ProvisionLeadsByEmailsResult> {
  const listId = params.listId.trim();
  const campaignId = params.campaignId.trim();
  const category = params.category;
  const jumSegment =
    params.jumSegment?.trim() ||
    (category === "jum"
      ? resolveJumVerticalByCampaignId(campaignId)?.segment ?? null
      : null);
  const normalizedEmails = normalizeProvisionEmails(params.emails);
  const apiKey = getInstantlyApiKey();
  const client = createLinkTrackingClient();
  const lookup = await findLeadsByEmails(client, normalizedEmails);

  const parsed: ParsedLead[] = [];
  for (const email of normalizedEmails) {
    parsed.push(await resolveListLead(apiKey, listId, campaignId, email));
  }

  const selected: ParsedLead[] = [];
  let skippedWrongCategory = 0;
  let skipped = 0;

  for (const lead of parsed) {
    const existing = lookup.get(lead.email);
    if (existing && existing.category !== category) {
      skippedWrongCategory += 1;
      continue;
    }
    const staleInstantlyId = needsInstantlyLeadResync(
      existing?.lead.instantly_lead_id,
      lead.instantlyLeadId,
    );
    if (needsProvision(lead.email, lookup, category) || staleInstantlyId) {
      selected.push(lead);
    } else {
      skipped += 1;
    }
  }

  const executed = await executeProvisionForSelectedLeads({
    selected,
    lookup,
    campaignId,
    category,
    fromCampaign: false,
    jumSegment,
  });

  const customVariablesByEmail = { ...executed.customVariablesByEmail };
  for (const email of normalizedEmails) {
    if (customVariablesByEmail[email]) continue;
    const existing = lookup.get(email);
    if (!existing || existing.category !== category) continue;
    const slug = leadSlug(existing.lead);
    if (!slug) continue;
    customVariablesByEmail[email] = buildInstantlyCustomVariables(
      slug,
      email,
      existing.lead.statut ?? "NOTBOOKED",
      category,
      category === "jum"
        ? {
            jumSegment:
              jumSegment ||
              (typeof existing.lead.profile?.segment === "string"
                ? existing.lead.profile.segment
                : null),
          }
        : undefined,
    );
  }

  return {
    listId,
    campaignId,
    category,
    requested: normalizedEmails.length,
    selected: selected.length,
    skipped,
    skippedWrongCategory,
    created: executed.created,
    updated: executed.updated,
    patched: executed.patched,
    failed: executed.failed,
    errors: executed.errors,
    customVariablesByEmail,
  };
}
