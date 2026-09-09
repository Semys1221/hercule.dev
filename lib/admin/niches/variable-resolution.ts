import type { Niche } from "@/lib/admin/navigation";
import { EMAIL_VARIABLE_CATALOG } from "@/lib/email-variables/catalog";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

export function resolveSupabaseColumn(key: string, niche: Niche): string | null {
  const definition = EMAIL_VARIABLE_CATALOG.find((entry) => entry.key === key);
  if (definition?.supabaseColumn) {
    return definition.supabaseColumn;
  }
  if (key === "confirmLink") {
    return niche === "comptable" ? "confirmation_comptable_link" : "confirmation_agence_link";
  }
  if (key === "post_booking_link") {
    return "post_booking_link";
  }
  if (key === "reservation_agence_link") {
    return "reservation_agence_link";
  }
  if (key === "reservation_comptable_link") {
    return "reservation_comptable_link";
  }
  if (key === "dashboardLink") {
    return "dashboard_link";
  }
  return null;
}

/** Instantly custom_variables key for outreach link vars; null if not provisioned via campaign PATCH. */
export function resolveInstantlyKey(key: string, niche: Niche): string | null {
  if (key === "reservation_agence_link") {
    return "reservation_agence_link";
  }
  if (key === "reservation_comptable_link") {
    return "reservation_entreprise_link";
  }
  if (key === "confirmation_agence_link" || key === "confirmation_comptable_link") {
    return "confirmation_agence_link";
  }
  if (key === "confirmLink") {
    return "confirmation_agence_link";
  }
  if (niche === "entreprise" && key === "post_booking_link") {
    return null;
  }
  return null;
}

export function readSupabaseColumnValue(
  row: Record<string, unknown>,
  column: string,
): string | null {
  const value = row[column];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isSupabaseValueFilled(
  row: LinkTrackingLead | Record<string, unknown>,
  key: string,
  niche: Niche,
): boolean {
  const column = resolveSupabaseColumn(key, niche);
  if (!column) {
    return true;
  }
  return Boolean(readSupabaseColumnValue(row as Record<string, unknown>, column));
}

export function isInstantlyValueFilled(
  customVariables: Record<string, unknown> | undefined,
  key: string,
  niche: Niche,
): boolean {
  const instantlyKey = resolveInstantlyKey(key, niche);
  if (!instantlyKey) {
    return true;
  }
  const value = customVariables?.[instantlyKey];
  if (typeof value !== "string") {
    return false;
  }
  return value.trim().length > 0;
}

export function formatCoverage(filled: number, total: number): string {
  if (total === 0) {
    return "—";
  }
  return `${filled}/${total}`;
}

export type VariableCoverageStatus = "ok" | "error" | "warning" | "na";

export function coverageStatus(
  filled: number,
  total: number,
  hasInstantlyKey: boolean,
): VariableCoverageStatus {
  if (total === 0) {
    return "na";
  }
  if (filled >= total) {
    return "ok";
  }
  return hasInstantlyKey ? "error" : "error";
}
