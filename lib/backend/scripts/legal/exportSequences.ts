/**
 * Export Supabase sequence templates to app/(marketing)/content/legal-documentation/{niche}/sequences/*.md
 *
 * Usage:
 *   pnpm sequences:export
 *   pnpm sequences:export --niche=comptable,cif
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BOOKINGS_SEQUENCE_TABS,
  bookingsSequenceTabsForNiche,
} from "@/lib/legacy/admin/bookings/bookings-sequence-tabs";
import { bookingCategoryForSlug } from "@/lib/legacy/admin/email-sequences/booking-category";
import {
  bookingSequenceTypesFor,
  getEmailSequence,
} from "@/lib/legacy/admin/email-sequences/registry";
import { getOutreachConfigView } from "@/lib/legacy/admin/niches/outreach-config";
import { loadAiReplyConfig } from "@/lib/legacy/ai-reply-agent/config";
import { getBookingEmailTemplates } from "@/lib/legacy/booking-communication/template-store";
import {
  extractColdEmailStepsFromCampaign,
  fetchCampaign,
  getInstantlyApiKey,
} from "@/lib/instantly";
import { listAllTemplates } from "@/lib/legacy/instantly-bypass/templates";
import type { BypassTemplateKey } from "@/lib/legacy/instantly-bypass/types";
import { sequencesDir } from "@/lib/legacy/legal-documentation/paths";
import {
  syncBookingSequenceToFile,
  syncBypassSequenceToFile,
  syncColdOutreachToFile,
  syncReplyAgentSequenceToFile,
} from "@/lib/legacy/legal-documentation/sync-sequences";
import type { Niche } from "@/lib/legacy/admin/navigation";

const ALL_NICHES: Niche[] = ["agence", "entreprise", "comptable", "cif"];

const PRODUCTION_SLUGS_BY_NICHE: Partial<Record<Niche, string[]>> = {
  comptable: [
    "payment-welcome",
    "onboarding-sequence",
    "free-trial",
    "free-trial-started",
  ],
  cif: ["payment-welcome", "onboarding-sequence"],
};

const ARCHIVE_COLD_EMAIL_BY_NICHE: Partial<Record<Niche, string>> = {
  comptable: join(process.cwd(), "archive/email_outreach_copy/comptable"),
};

function parseNicheFilter(): Niche[] {
  const arg = process.argv.find((value) => value.startsWith("--niche="));
  if (!arg) {
    return ALL_NICHES;
  }
  const values = arg.slice("--niche=".length).split(",").map((value) => value.trim());
  const filtered = values.filter((value): value is Niche =>
    ALL_NICHES.includes(value as Niche),
  );
  if (filtered.length === 0) {
    throw new Error(`Invalid --niche value. Expected one of: ${ALL_NICHES.join(", ")}`);
  }
  return filtered;
}

function slugsToExport(niche: Niche): string[] {
  const bookingSlugs = bookingsSequenceTabsForNiche(niche).map((tab) =>
    tab.resolveSlug(niche),
  );
  const productionSlugs = PRODUCTION_SLUGS_BY_NICHE[niche] ?? [];
  return [...new Set([...bookingSlugs, ...productionSlugs])];
}

function tabNeedsCampaign(slug: string, niche: Niche): boolean {
  const tab = bookingsSequenceTabsForNiche(niche).find(
    (entry) => entry.resolveSlug(niche) === slug,
  );
  return tab?.needsCampaign ?? false;
}

function parseArchiveColdEmail(path: string): Array<{ subject: string; body: string }> {
  const raw = readFileSync(path, "utf-8");
  const mail1Section = raw.split(/\nReply\n/)[0] ?? raw;
  const body = mail1Section.replace(/^Mail 1\n\n?/, "").trim();
  if (!body) {
    return [];
  }
  return [{ subject: "", body }];
}

async function exportBookingSequence(niche: Niche, slug: string): Promise<boolean> {
  const sequence = getEmailSequence(slug);
  if (!sequence || sequence.editorKind !== "booking") {
    return false;
  }
  const emailTypes = bookingSequenceTypesFor(slug, niche);
  if (emailTypes.length === 0) {
    return false;
  }
  const category = bookingCategoryForSlug(slug, niche);
  const templates = await getBookingEmailTemplates(category);
  const byType = new Map(templates.map((row) => [row.email_type, row]));
  const filtered = emailTypes
    .map((emailType) => byType.get(emailType))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  if (filtered.length === 0) {
    return false;
  }
  const stepMeta = sequence.steps
    .filter((step) => step.emailType && emailTypes.includes(step.emailType))
    .map((step) => ({
      id: step.id,
      label: step.label,
      delay: step.delay,
    }));
  syncBookingSequenceToFile({
    niche,
    slug,
    emailTypes,
    stepMeta: stepMeta.length > 0 ? stepMeta : sequence.steps.map((step) => ({
      id: step.id,
      label: step.label,
      delay: step.delay,
    })),
    templates: filtered.map((row) => ({
      email_type: row.email_type,
      subject: row.subject,
      body: row.body,
    })),
  });
  return true;
}

async function exportBypassSequence(
  niche: Niche,
  slug: string,
  campaignId: string,
): Promise<boolean> {
  const sequence = getEmailSequence(slug);
  if (!sequence || sequence.editorKind !== "bypass" || !sequence.bypassTemplateKeys) {
    return false;
  }
  const templates = await listAllTemplates(campaignId);
  const keys = new Set(sequence.bypassTemplateKeys);
  const filtered = templates.filter((row) => keys.has(row.template_key as BypassTemplateKey));
  if (filtered.length === 0) {
    return false;
  }
  const stepMeta = sequence.steps
    .filter((step) => step.templateKey && keys.has(step.templateKey))
    .map((step) => ({
      id: step.id,
      label: step.label,
      delay: step.delay,
      templateKey: step.templateKey as BypassTemplateKey,
    }));
  syncBypassSequenceToFile({
    niche,
    slug,
    campaignId,
    templateKeys: sequence.bypassTemplateKeys,
    stepMeta,
    templates: filtered.map((row) => ({
      template_key: row.template_key,
      subject: row.subject,
      body_html: row.body_html,
    })),
  });
  return true;
}

async function exportReplyAgent(niche: Niche, campaignId: string): Promise<boolean> {
  const config = await loadAiReplyConfig(campaignId);
  if (!config?.prompt_snapshot) {
    return false;
  }
  syncReplyAgentSequenceToFile({
    niche,
    slug: "reply-agent",
    campaignId,
    promptSnapshot: config.prompt_snapshot,
  });
  return true;
}

async function exportColdOutreach(niche: Niche, campaignId: string): Promise<boolean> {
  let steps: Array<{ subject: string; body: string; delay: string }> = [];

  try {
    const apiKey = getInstantlyApiKey();
    const campaign = await fetchCampaign(apiKey, campaignId);
    steps = extractColdEmailStepsFromCampaign(campaign);
  } catch (error) {
    const archivePath = ARCHIVE_COLD_EMAIL_BY_NICHE[niche];
    if (!archivePath || !existsSync(archivePath)) {
      console.warn(
        `skip ${niche}/cold-email: Instantly fetch failed and no archive fallback`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
    const archived = parseArchiveColdEmail(archivePath);
    steps = archived.map((step, index) => ({
      subject: step.subject,
      body: step.body,
      delay: index === 0 ? "Immédiat" : `+${index}j`,
    }));
    console.warn(
      `warn ${niche}/cold-email: using archive fallback (${archivePath})`,
    );
  }

  if (steps.length === 0) {
    return false;
  }

  syncColdOutreachToFile({
    niche,
    campaignId,
    steps: steps.map((step, index) => ({
      id: `mail_${index + 1}`,
      label: `Mail ${index + 1}`,
      delay: step.delay,
      subject: step.subject,
      body: step.body,
    })),
  });
  return true;
}

async function exportSequenceSlug(
  niche: Niche,
  slug: string,
  campaignId: string | null,
): Promise<boolean> {
  const sequence = getEmailSequence(slug);
  if (!sequence) {
    return false;
  }

  if (sequence.editorKind === "booking") {
    return exportBookingSequence(niche, slug);
  }

  if (!campaignId) {
    console.warn(`skip ${niche}/${slug}: no campaign linked`);
    return false;
  }

  if (sequence.editorKind === "bypass") {
    return exportBypassSequence(niche, slug, campaignId);
  }

  if (sequence.editorKind === "reply_agent" && slug === "reply-agent") {
    return exportReplyAgent(niche, campaignId);
  }

  return false;
}

async function main(): Promise<void> {
  const niches = parseNicheFilter();
  let exported = 0;

  for (const niche of niches) {
    mkdirSync(sequencesDir(niche), { recursive: true });
    const outreach = await getOutreachConfigView(niche);
    const campaignId = outreach.instantly_campaign_id;

    if (campaignId) {
      if (await exportColdOutreach(niche, campaignId)) {
        exported += 1;
        console.log(`exported cold-email ${niche}`);
      }
    } else {
      console.warn(`skip ${niche}/cold-email: no campaign linked`);
    }

    for (const slug of slugsToExport(niche)) {
      const needsCampaign = tabNeedsCampaign(slug, niche);
      const resolvedCampaignId = needsCampaign ? campaignId : null;

      if (await exportSequenceSlug(niche, slug, resolvedCampaignId)) {
        exported += 1;
        console.log(`exported ${niche}/${slug}`);
      }
    }
  }

  console.log(`sequences:export complete (${exported} files)`);
  console.log(`tabs catalog: ${BOOKINGS_SEQUENCE_TABS.length} definitions`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
