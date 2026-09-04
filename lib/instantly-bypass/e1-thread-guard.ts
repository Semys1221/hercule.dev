import { listEmails } from "./client";

import type { InstantlyEmailRecord } from "./types";

const MANDATAIRES_MARKER = "mandataires";

const E1_FINGERPRINTS = [
  "voici les precisions",
  "l un des groupes de clients",
  "audit de compatibilite",
  "mon agence est compatible",
  "deposer la candidature",
  "premiers echanges entre cabinets",
  MANDATAIRES_MARKER,
] as const;

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeEmailText(raw: string): string {
  const withoutTags = raw.replace(/<[^>]+>/g, " ");
  return stripAccents(withoutTags.replace(/\s+/g, " ").trim().toLowerCase());
}

export function isHerculeEmail(text: string): boolean {
  const normalized = normalizeEmailText(text);
  return normalized.includes("beatrice meyer") || normalized.includes("hercule.dev");
}

function extractEmailText(item: InstantlyEmailRecord & Record<string, unknown>): string {
  const body = item.body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["html", "text", "plain"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }
  for (const key of ["body_html", "html", "text"]) {
    const value = item[key as keyof InstantlyEmailRecord];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return String(item.subject ?? "");
}

function messageMatchesE1(text: string): boolean {
  if (!isHerculeEmail(text)) {
    return false;
  }
  const normalized = normalizeEmailText(text);
  return E1_FINGERPRINTS.some((marker) => normalized.includes(marker));
}

export function countE1MarkersInSentEmails(items: InstantlyEmailRecord[]): number {
  let count = 0;
  for (const item of items) {
    const text = extractEmailText(item as InstantlyEmailRecord & Record<string, unknown>);
    if (messageMatchesE1(text)) {
      count += 1;
    }
  }
  return count;
}

export function countMandatairesInSentEmails(items: InstantlyEmailRecord[]): number {
  let count = 0;
  for (const item of items) {
    const text = extractEmailText(item as InstantlyEmailRecord & Record<string, unknown>);
    if (!isHerculeEmail(text)) {
      continue;
    }
    if (normalizeEmailText(text).includes(MANDATAIRES_MARKER)) {
      count += 1;
    }
  }
  return count;
}

export async function threadAlreadyHasE1(
  apiKey: string,
  params: { leadEmail: string; campaignId: string },
): Promise<boolean> {
  const sent = await listEmails(apiKey, {
    search: params.leadEmail,
    campaignId: params.campaignId,
    emailType: "sent",
    limit: 50,
  });
  return countE1MarkersInSentEmails(sent) >= 1;
}

export function isDuplicateE1Thread(sent: InstantlyEmailRecord[]): boolean {
  return countMandatairesInSentEmails(sent) >= 2;
}
