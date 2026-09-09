import { catalogVariablesForNiche } from "@/lib/email-variables/catalog";
import {
  extractVariableKeys,
  extractVariablesFromSteps,
  formatVariableToken,
} from "@/lib/admin/email-sequences/extract-variables";
import { createLinkTrackingClient, isMissingRelationError } from "@/lib/link-tracking/supabase";
import type { Niche } from "@/lib/admin/navigation";

export async function listEnabledVariableTokens(niche: Niche): Promise<string[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("email_variable_bindings")
    .select("variable_key")
    .eq("niche", niche)
    .eq("enabled", true);

  if (error) {
    if (isMissingRelationError(error.message)) {
      return catalogVariablesForNiche(niche);
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ variable_key: string }>;
  if (rows.length === 0) {
    return catalogVariablesForNiche(niche);
  }

  return rows.map((row) => formatVariableToken(row.variable_key));
}

export function enabledKeysFromTokens(tokens: string[]): Set<string> {
  return new Set(tokens.map((token) => token.replace(/^\{\{|\}\}$/g, "")));
}

export function validateSequenceCopy(
  enabledTokens: string[],
  steps: Array<{ subject?: string; body?: string }>,
): { ok: true } | { ok: false; unknown: string[] } {
  const enabled = enabledKeysFromTokens(enabledTokens);
  const used = extractVariablesFromSteps(steps);
  const unknown = used.filter((key) => !enabled.has(key));
  if (unknown.length > 0) {
    return { ok: false, unknown };
  }
  return { ok: true };
}

export function validateSequenceText(
  enabledTokens: string[],
  text: string,
): { ok: true } | { ok: false; unknown: string[] } {
  const enabled = enabledKeysFromTokens(enabledTokens);
  const unknown = extractVariableKeys(text).filter((key) => !enabled.has(key));
  if (unknown.length > 0) {
    return { ok: false, unknown };
  }
  return { ok: true };
}
