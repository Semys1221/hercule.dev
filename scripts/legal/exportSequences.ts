/**
 * Export Supabase sequence templates to doc/legal-documentation/{niche}/sequences/*.md
 *
 * Usage: pnpm sequences:export
 */

import { mkdirSync } from "node:fs";

import {
  BOOKINGS_SEQUENCE_TABS,
  bookingsSequenceTabsForNiche,
} from "@/lib/admin/bookings/bookings-sequence-tabs";
import {
  bookingSequenceTypesFor,
  getEmailSequence,
} from "@/lib/admin/email-sequences/registry";
import { sequencesDir } from "@/lib/legal-documentation/paths";
import {
  syncBookingSequenceToFile,
  syncBypassSequenceToFile,
  syncReplyAgentSequenceToFile,
} from "@/lib/legal-documentation/sync-sequences";
import { getOutreachConfigView } from "@/lib/admin/niches/outreach-config";
import { getBookingEmailTemplates } from "@/lib/booking-communication/template-store";
import { listAllTemplates } from "@/lib/instantly-bypass/templates";
import { loadAiReplyConfig } from "@/lib/ai-reply-agent/config";
import type { Niche } from "@/lib/admin/navigation";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

const ALL_NICHES: Niche[] = ["agence", "entreprise", "comptable", "cif"];

async function exportBookingSequence(niche: Niche, slug: string): Promise<boolean> {
  const sequence = getEmailSequence(slug);
  if (!sequence || sequence.editorKind !== "booking") {
    return false;
  }
  const emailTypes = bookingSequenceTypesFor(slug, niche);
  if (emailTypes.length === 0) {
    return false;
  }
  const category = sequence.bookingCategory ?? niche;
  const templates = await getBookingEmailTemplates(category);
  const filtered = templates.filter((row) => emailTypes.includes(row.email_type));
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

async function main(): Promise<void> {
  let exported = 0;

  for (const niche of ALL_NICHES) {
    mkdirSync(sequencesDir(niche), { recursive: true });
    const tabs = bookingsSequenceTabsForNiche(niche);

    for (const tab of tabs) {
      const sequence = getEmailSequence(tab.resolveSlug(niche));
      if (!sequence) {
        continue;
      }
      const slug = sequence.slug;

      if (sequence.editorKind === "booking") {
        if (await exportBookingSequence(niche, slug)) {
          exported += 1;
          console.log(`exported booking ${niche}/${slug}`);
        }
        continue;
      }

      if (!tab.needsCampaign) {
        continue;
      }

      const outreach = await getOutreachConfigView(niche);
      const campaignId = outreach.instantly_campaign_id;
      if (!campaignId) {
        console.warn(`skip ${niche}/${slug}: no campaign linked`);
        continue;
      }

      if (sequence.editorKind === "bypass") {
        if (await exportBypassSequence(niche, slug, campaignId)) {
          exported += 1;
          console.log(`exported bypass ${niche}/${slug}`);
        }
      } else if (sequence.editorKind === "reply_agent" && slug === "reply-agent") {
        if (await exportReplyAgent(niche, campaignId)) {
          exported += 1;
          console.log(`exported reply-agent ${niche}`);
        }
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
