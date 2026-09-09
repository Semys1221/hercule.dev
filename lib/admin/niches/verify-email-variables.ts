import {
  buildVariableToSequenceSlugsMap,
  collectUsedVariableKeys,
  loadLiveSequenceCopyEntries,
} from "@/lib/admin/niches/live-sequence-variables";
import { resolveInstantlyCampaignId } from "@/lib/admin/niches/outreach-config";
import {
  formatCoverage,
  isInstantlyValueFilled,
  isSupabaseValueFilled,
  resolveInstantlyKey,
  resolveSupabaseColumn,
  type VariableCoverageStatus,
} from "@/lib/admin/niches/variable-resolution";
import { formatVariableToken } from "@/lib/admin/email-sequences/extract-variables";
import { fetchLeadsFromCampaign, getInstantlyApiKey } from "@/lib/instantly";
import { normalizeEmail, createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import type { Niche } from "@/lib/admin/navigation";

export type VariableBindingRow = {
  variable_key: string;
  enabled: boolean;
  base_url_preview: string | null;
};

export type EmailVariableStatusRow = {
  key: string;
  token: string;
  baseUrlPreview: string | null;
  sequenceSlugs: string[];
  supabaseFilled: number;
  supabaseTotal: number;
  supabaseLabel: string;
  instantlyFilled: number;
  instantlyTotal: number;
  instantlyLabel: string;
  status: VariableCoverageStatus;
  usedInLiveCopy: boolean;
  hasInstantlyKey: boolean;
};

export type LeadVariableMismatch = {
  email: string;
  missingSupabase: string[];
  missingInstantly: string[];
};

export type CrossNicheVariableWarning = {
  variableKey: string;
  niches: Niche[];
  message: string;
};

export type VerifyEmailVariablesResult = {
  niche: Niche;
  campaignId: string | null;
  campaignLinked: boolean;
  rows: EmailVariableStatusRow[];
  mismatches: LeadVariableMismatch[];
  crossNicheWarnings: CrossNicheVariableWarning[];
  hasErrors: boolean;
};

const DEFAULT_MAX_LEADS = 500;

export async function listVariableBindings(niche: Niche): Promise<VariableBindingRow[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("email_variable_bindings")
    .select("variable_key, enabled, base_url_preview")
    .eq("niche", niche)
    .eq("enabled", true)
    .order("variable_key");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VariableBindingRow[];
}

export async function listCrossNicheEnabledKeys(): Promise<Map<string, Niche[]>> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("email_variable_bindings")
    .select("niche, variable_key")
    .eq("enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, Niche[]>();
  for (const row of (data ?? []) as Array<{ niche: Niche; variable_key: string }>) {
    const niches = map.get(row.variable_key) ?? [];
    if (!niches.includes(row.niche)) {
      niches.push(row.niche);
    }
    map.set(row.variable_key, niches);
  }
  return map;
}

export function detectCrossNicheWarnings(params: {
  usedKeys: Set<string>;
  crossNicheMap: Map<string, Niche[]>;
  currentNiche: Niche;
}): CrossNicheVariableWarning[] {
  const warnings: CrossNicheVariableWarning[] = [];
  for (const key of params.usedKeys) {
    const niches = params.crossNicheMap.get(key) ?? [];
    if (niches.length >= 2 && niches.includes(params.currentNiche)) {
      warnings.push({
        variableKey: key,
        niches: [...niches],
        message: `{{${key}}} est activé sur ${niches.join(", ")} — risque de collision sémantique.`,
      });
    }
  }
  return warnings;
}

function computeRowStatus(params: {
  usedInLiveCopy: boolean;
  supabaseFilled: number;
  supabaseTotal: number;
  instantlyFilled: number;
  instantlyTotal: number;
  hasInstantlyKey: boolean;
  hasCrossNicheWarning: boolean;
}): VariableCoverageStatus {
  if (!params.usedInLiveCopy) {
    return "na";
  }
  if (params.hasCrossNicheWarning) {
    return "warning";
  }
  const supabaseOk =
    params.supabaseTotal === 0 || params.supabaseFilled >= params.supabaseTotal;
  const instantlyOk =
    !params.hasInstantlyKey ||
    params.instantlyTotal === 0 ||
    params.instantlyFilled >= params.instantlyTotal;
  if (supabaseOk && instantlyOk) {
    return "ok";
  }
  return "error";
}

async function loadSupabaseLeadsForEmails(
  niche: Niche,
  emails: string[],
): Promise<Map<string, LinkTrackingLead>> {
  const map = new Map<string, LinkTrackingLead>();
  if (emails.length === 0) {
    return map;
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from(niche)
    .select("*")
    .in(
      "email",
      emails.map((email) => normalizeEmail(email)),
    );

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as LinkTrackingLead[]) {
    map.set(normalizeEmail(row.email), row);
  }
  return map;
}

export async function buildVariableStatusSnapshot(
  niche: Niche,
): Promise<Omit<VerifyEmailVariablesResult, "mismatches" | "hasErrors">> {
  const campaignId = await resolveInstantlyCampaignId(niche);
  const bindings = await listVariableBindings(niche);
  const copyEntries = await loadLiveSequenceCopyEntries(niche, campaignId);
  const usedKeys = collectUsedVariableKeys(copyEntries);
  const slugMap = buildVariableToSequenceSlugsMap(copyEntries);
  const crossNicheMap = await listCrossNicheEnabledKeys();
  const crossNicheWarnings = detectCrossNicheWarnings({
    usedKeys,
    crossNicheMap,
    currentNiche: niche,
  });
  const crossNicheKeys = new Set(crossNicheWarnings.map((warning) => warning.variableKey));

  const rows: EmailVariableStatusRow[] = bindings.map((binding) => {
    const key = binding.variable_key;
    const usedInLiveCopy = usedKeys.has(key);
    const hasInstantlyKey = resolveInstantlyKey(key, niche) !== null;
    return {
      key,
      token: formatVariableToken(key),
      baseUrlPreview: binding.base_url_preview,
      sequenceSlugs: slugMap.get(key) ?? [],
      supabaseFilled: 0,
      supabaseTotal: 0,
      supabaseLabel: "—",
      instantlyFilled: 0,
      instantlyTotal: 0,
      instantlyLabel: hasInstantlyKey ? "—" : "n/a",
      status: usedInLiveCopy ? "na" : "na",
      usedInLiveCopy,
      hasInstantlyKey,
    };
  });

  for (const row of rows) {
    row.status = computeRowStatus({
      usedInLiveCopy: row.usedInLiveCopy,
      supabaseFilled: row.supabaseFilled,
      supabaseTotal: row.supabaseTotal,
      instantlyFilled: row.instantlyFilled,
      instantlyTotal: row.instantlyTotal,
      hasInstantlyKey: row.hasInstantlyKey,
      hasCrossNicheWarning: crossNicheKeys.has(row.key),
    });
  }

  return {
    niche,
    campaignId,
    campaignLinked: Boolean(campaignId),
    rows,
    crossNicheWarnings,
  };
}

export async function verifyEmailVariablesForNiche(
  niche: Niche,
  options: { maxLeads?: number } = {},
): Promise<VerifyEmailVariablesResult> {
  const maxLeads = options.maxLeads ?? DEFAULT_MAX_LEADS;
  const campaignId = await resolveInstantlyCampaignId(niche);
  const bindings = await listVariableBindings(niche);
  const copyEntries = await loadLiveSequenceCopyEntries(niche, campaignId);
  const usedKeys = collectUsedVariableKeys(copyEntries);
  const slugMap = buildVariableToSequenceSlugsMap(copyEntries);
  const crossNicheMap = await listCrossNicheEnabledKeys();
  const crossNicheWarnings = detectCrossNicheWarnings({
    usedKeys,
    crossNicheMap,
    currentNiche: niche,
  });
  const crossNicheKeys = new Set(crossNicheWarnings.map((warning) => warning.variableKey));

  const keysToVerify = [...usedKeys].filter((key) =>
    bindings.some((binding) => binding.enabled && binding.variable_key === key),
  );

  let campaignLeads: Array<{ email: string; custom_variables?: Record<string, unknown> }> =
    [];
  if (campaignId) {
    const apiKey = getInstantlyApiKey();
    const leads = await fetchLeadsFromCampaign(apiKey, campaignId, { maxLeads });
    campaignLeads = leads
      .map((lead) => ({
        email: normalizeEmail(String(lead.email ?? "")),
        custom_variables: lead.custom_variables,
      }))
      .filter((lead) => lead.email.includes("@"));
  }

  const supabaseByEmail = await loadSupabaseLeadsForEmails(
    niche,
    campaignLeads.map((lead) => lead.email),
  );

  const mismatches: LeadVariableMismatch[] = [];

  for (const lead of campaignLeads) {
    const dbRow = supabaseByEmail.get(lead.email);
    const missingSupabase: string[] = [];
    const missingInstantly: string[] = [];

    for (const key of keysToVerify) {
      if (!resolveSupabaseColumn(key, niche)) {
        continue;
      }
      if (!dbRow || !isSupabaseValueFilled(dbRow, key, niche)) {
        missingSupabase.push(key);
      }
      const instantlyKey = resolveInstantlyKey(key, niche);
      if (instantlyKey && !isInstantlyValueFilled(lead.custom_variables, key, niche)) {
        missingInstantly.push(key);
      }
    }

    if (missingSupabase.length > 0 || missingInstantly.length > 0) {
      mismatches.push({
        email: lead.email,
        missingSupabase,
        missingInstantly,
      });
    }
  }

  const total = campaignLeads.length;

  const rows: EmailVariableStatusRow[] = bindings.map((binding) => {
    const key = binding.variable_key;
    const usedInLiveCopy = usedKeys.has(key);
    const hasInstantlyKey = resolveInstantlyKey(key, niche) !== null;
    const column = resolveSupabaseColumn(key, niche);

    let supabaseFilled = 0;
    if (usedInLiveCopy && column && total > 0) {
      for (const lead of campaignLeads) {
        const dbRow = supabaseByEmail.get(lead.email);
        if (dbRow && isSupabaseValueFilled(dbRow, key, niche)) {
          supabaseFilled += 1;
        }
      }
    }

    let instantlyFilled = 0;
    if (usedInLiveCopy && hasInstantlyKey && total > 0) {
      for (const lead of campaignLeads) {
        if (isInstantlyValueFilled(lead.custom_variables, key, niche)) {
          instantlyFilled += 1;
        }
      }
    }

    const supabaseTotal = usedInLiveCopy && column ? total : 0;
    const instantlyTotal = usedInLiveCopy && hasInstantlyKey ? total : 0;

    return {
      key,
      token: formatVariableToken(key),
      baseUrlPreview: binding.base_url_preview,
      sequenceSlugs: slugMap.get(key) ?? [],
      supabaseFilled,
      supabaseTotal,
      supabaseLabel: formatCoverage(supabaseFilled, supabaseTotal),
      instantlyFilled,
      instantlyTotal,
      instantlyLabel: hasInstantlyKey
        ? formatCoverage(instantlyFilled, instantlyTotal)
        : "n/a",
      status: computeRowStatus({
        usedInLiveCopy,
        supabaseFilled,
        supabaseTotal,
        instantlyFilled,
        instantlyTotal,
        hasInstantlyKey,
        hasCrossNicheWarning: crossNicheKeys.has(key),
      }),
      usedInLiveCopy,
      hasInstantlyKey,
    };
  });

  const hasErrors = rows.some((row) => row.status === "error") || mismatches.length > 0;

  return {
    niche,
    campaignId,
    campaignLinked: Boolean(campaignId),
    rows,
    mismatches,
    crossNicheWarnings,
    hasErrors,
  };
}
