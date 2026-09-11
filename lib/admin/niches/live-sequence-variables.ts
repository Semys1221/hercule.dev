import {
  bookingSequenceTypesFor,
  getEmailSequence,
} from "@/lib/admin/email-sequences/registry";
import {
  bookingsSequenceTabsForNiche,
  resolveBookingsSequenceEntry,
} from "@/lib/admin/bookings/bookings-sequence-tabs";
import {
  clientsSequenceTabsForNiche,
  resolveClientsSequenceEntry,
} from "@/lib/admin/clients/clients-sequence-tabs";
import {
  extractVariableKeys,
  extractVariablesFromSteps,
} from "@/lib/admin/email-sequences/extract-variables";
import { getBookingEmailTemplates } from "@/lib/booking-communication/template-store";
import { listAllTemplates } from "@/lib/instantly-bypass/templates";
import type { Niche } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";

export function getLiveSequenceSlugsForNiche(niche: Niche): string[] {
  const bookingSlugs = bookingsSequenceTabsForNiche(niche).map((tab) =>
    tab.resolveSlug(niche),
  );
  const clientSlugs = clientsSequenceTabsForNiche(niche).map((tab) =>
    tab.resolveSlug(niche),
  );
  return [...new Set([...bookingSlugs, ...clientSlugs])];
}

export function buildVariableToSequenceSlugsMap(
  entries: Array<{ slug: string; texts: string[] }>,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const entry of entries) {
    const keys = new Set<string>();
    for (const text of entry.texts) {
      for (const key of extractVariableKeys(text)) {
        keys.add(key);
      }
    }
    for (const key of keys) {
      const slugs = map.get(key) ?? [];
      slugs.push(entry.slug);
      map.set(key, slugs);
    }
  }
  return map;
}

export function collectUsedVariableKeys(
  entries: Array<{ slug: string; texts: string[] }>,
): Set<string> {
  const map = buildVariableToSequenceSlugsMap(entries);
  return new Set(map.keys());
}

function bookingCategoryForSlug(
  slug: string,
  niche: Niche,
): LeadCategory {
  const sequence = getEmailSequence(slug);
  if (niche === "comptable" && sequence?.audiences.includes("comptable")) {
    return "comptable";
  }
  if (sequence?.bookingCategory) {
    return sequence.bookingCategory;
  }
  return niche;
}

async function loadBookingSequenceTexts(
  slug: string,
  niche: Niche,
): Promise<string[]> {
  const sequence = getEmailSequence(slug);
  if (!sequence || sequence.editorKind !== "booking") {
    return [];
  }
  const category = bookingCategoryForSlug(slug, niche);
  const emailTypes = bookingSequenceTypesFor(slug, niche);
  if (emailTypes.length === 0) {
    return [];
  }
  const templates = await getBookingEmailTemplates(category);
  const byType = new Map(templates.map((row) => [row.email_type, row]));
  const texts: string[] = [];
  for (const emailType of emailTypes) {
    const row = byType.get(emailType);
    if (!row) {
      continue;
    }
    texts.push(row.subject, row.body);
  }
  return texts;
}

async function loadBypassSequenceTexts(
  slug: string,
  campaignId: string,
): Promise<string[]> {
  const sequence = getEmailSequence(slug);
  if (!sequence || sequence.editorKind !== "bypass" || !sequence.bypassTemplateKeys) {
    return [];
  }
  const templates = await listAllTemplates(campaignId);
  const keys = new Set(sequence.bypassTemplateKeys);
  const texts: string[] = [];
  for (const template of templates) {
    if (!keys.has(template.template_key)) {
      continue;
    }
    texts.push(template.subject ?? "", template.body_html ?? "");
  }
  return texts;
}

export async function loadLiveSequenceCopyEntries(
  niche: Niche,
  campaignId: string | null,
): Promise<Array<{ slug: string; texts: string[] }>> {
  const slugs = getLiveSequenceSlugsForNiche(niche);
  const entries: Array<{ slug: string; texts: string[] }> = [];

  for (const slug of slugs) {
    const sequence = getEmailSequence(slug);
    if (!sequence) {
      continue;
    }
    let texts: string[] = [];
    if (sequence.editorKind === "booking") {
      texts = await loadBookingSequenceTexts(slug, niche);
    } else if (sequence.editorKind === "bypass" && campaignId) {
      texts = await loadBypassSequenceTexts(slug, campaignId);
    }
    if (texts.length > 0) {
      entries.push({ slug, texts });
    }
  }

  return entries;
}

export function liveSequenceSlugsFromTabs(niche: Niche): string[] {
  const slugs: string[] = [];
  for (const tab of bookingsSequenceTabsForNiche(niche)) {
    const entry = resolveBookingsSequenceEntry(tab, niche);
    if (entry) {
      slugs.push(entry.slug);
    }
  }
  for (const tab of clientsSequenceTabsForNiche(niche)) {
    const entry = resolveClientsSequenceEntry(tab, niche);
    if (entry) {
      slugs.push(entry.slug);
    }
  }
  return [...new Set(slugs)];
}

export function extractUsedVariablesFromSteps(
  steps: Array<{ subject?: string; body?: string }>,
): string[] {
  return extractVariablesFromSteps(steps);
}
