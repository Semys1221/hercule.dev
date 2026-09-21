import type { BypassTemplateKey, InstantlyLeadRecord } from "./types";

const SEGMENT_TEMPLATE_KEYS: Record<string, string> = {
  restaurant: "interested_email1_restaurant",
  b2b: "interested_email1_b2b",
  dentiste: "interested_email1_dentiste",
  medecin: "interested_email1_medecin",
  kine: "interested_email1_kine",
  avocat: "interested_email1_avocat",
  architecte: "interested_email1_architecte",
  veterinaire: "interested_email1_veterinaire",
};

type SegmentLead = {
  payload?: Record<string, unknown> | null;
  custom_variables?: Record<string, unknown> | null;
};

function readSegmentFromRecord(
  record: Record<string, unknown> | null | undefined,
): string | null {
  if (!record) return null;
  for (const key of ["jum_segment", "segment"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().toLowerCase();
    }
  }
  return null;
}

export function readJumSegment(
  lead?: SegmentLead | null,
  payload?: Record<string, unknown>,
): string | null {
  return (
    readSegmentFromRecord(payload) ??
    readSegmentFromRecord(lead?.payload ?? undefined) ??
    readSegmentFromRecord(lead?.custom_variables ?? undefined)
  );
}

export function resolveInterestedEmail1TemplateKey(
  lead?: InstantlyLeadRecord | null,
  payload?: Record<string, unknown>,
): BypassTemplateKey {
  const segment = readJumSegment(lead ?? undefined, payload);
  if (!segment) {
    return "interested_email1";
  }
  return SEGMENT_TEMPLATE_KEYS[segment] ?? "interested_email1";
}
