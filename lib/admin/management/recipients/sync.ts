import { CONFERENCE_INVITE_JOB_TYPES } from "@/lib/booking-communication/jobs";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { Niche } from "@/lib/admin/navigation";
import { getOutreachConfigView } from "@/lib/admin/niches/outreach-config";

import { enrollRecipient } from "./live-sync";
import { phaseForSequenceSlug, providerForSlug } from "./phase-map";
import { findActiveRecipient } from "./queries";
import type { RecipientStatus } from "./types";

const TERMINAL_PIPELINE_STEPS = new Set(["step_4", "closed", "done"]);

export function slugFromBookingEmailTypes(emailTypes: string[]): string | null {
  const typeSet = new Set(emailTypes);
  if (CONFERENCE_INVITE_JOB_TYPES.some((type) => typeSet.has(type))) {
    return "cif-conference-invite";
  }
  if (typeSet.has("onboarding_j0") || typeSet.has("onboarding_reminder_m10")) {
    return "onboarding-sequence";
  }
  if (typeSet.has("close_indecis_1")) {
    return "close-indecis";
  }
  if (typeSet.has("no_show_indecis_1")) {
    return "sales-call-no-show";
  }
  if (typeSet.has("comptable_acquisition_welcome")) {
    return "comptable-acquisition-post-payment";
  }
  return null;
}

async function upsertFromBackfill(params: {
  leadEmail: string;
  leadId: string | null;
  niche: Niche;
  sequenceSlug: string;
  status: RecipientStatus;
  campaignId: string | null;
  currentStep: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  metadata: Record<string, unknown>;
  dryRun: boolean;
}): Promise<"inserted" | "updated" | "skipped"> {
  if (params.dryRun) {
    return "inserted";
  }

  const phase = phaseForSequenceSlug(params.sequenceSlug);
  const provider = providerForSlug(params.sequenceSlug);
  if (!phase || !provider) {
    return "skipped";
  }

  const existing = await findActiveRecipient({
    leadEmail: params.leadEmail,
    niche: params.niche,
    sequenceSlug: params.sequenceSlug,
  });

  await enrollRecipient({
    leadEmail: params.leadEmail,
    niche: params.niche,
    sequenceSlug: params.sequenceSlug,
    leadId: params.leadId,
    campaignId: params.campaignId,
    status: params.status,
    currentStep: params.currentStep,
    scheduledAt: params.scheduledAt,
    metadata: { ...params.metadata, backfill: true },
  });

  return existing ? "updated" : "inserted";
}

export async function backfillRecipientsForNiche(
  niche: Niche,
  dryRun = false,
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const client = createLinkTrackingClient();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const outreachConfig = await getOutreachConfigView(niche);
  const campaignId = outreachConfig.instantly_campaign_id;

  if (campaignId) {
    const { data: pipelines } = await client
      .from("instantly_bypass_pipeline")
      .select("lead_email, step, campaign_id")
      .eq("campaign_id", campaignId);

    for (const row of pipelines ?? []) {
      const step = String(row.step ?? "");
      if (TERMINAL_PIPELINE_STEPS.has(step)) {
        skipped += 1;
        continue;
      }
      const slug = "subsequence-interested";
      const phase = phaseForSequenceSlug(slug);
      const provider = providerForSlug(slug);
      if (!phase || !provider) {
        skipped += 1;
        continue;
      }
      const result = await upsertFromBackfill({
        leadEmail: String(row.lead_email).trim().toLowerCase(),
        leadId: null,
        niche,
        sequenceSlug: slug,
        status: "active",
        campaignId: String(row.campaign_id),
        currentStep: step,
        scheduledAt: null,
        startedAt: new Date().toISOString(),
        metadata: { source: "instantly_bypass_pipeline" },
        dryRun,
      });
      if (result === "inserted") inserted += 1;
      else if (result === "updated") updated += 1;
      else skipped += 1;
    }
  }

  const { data: pendingJobs } = await client
    .from("booking_email_jobs")
    .select("lead_id, lead_category, email_type, scheduled_for")
    .eq("lead_category", niche)
    .eq("status", "pending");

  const jobsByLead = new Map<string, { types: string[]; scheduled: string | null }>();
  for (const job of pendingJobs ?? []) {
    const leadId = String(job.lead_id);
    const entry = jobsByLead.get(leadId) ?? { types: [], scheduled: null };
    entry.types.push(String(job.email_type));
    if (!entry.scheduled || String(job.scheduled_for) < entry.scheduled) {
      entry.scheduled = String(job.scheduled_for);
    }
    jobsByLead.set(leadId, entry);
  }

  for (const [leadId, { types, scheduled }] of jobsByLead) {
    const slug = slugFromBookingEmailTypes(types);
    if (!slug) {
      skipped += 1;
      continue;
    }
    const phase = phaseForSequenceSlug(slug);
    const provider = providerForSlug(slug);
    if (!phase || !provider) {
      skipped += 1;
      continue;
    }

    const { data: lead } = await client.from(niche).select("email").eq("id", leadId).maybeSingle();
    if (!lead?.email) {
      skipped += 1;
      continue;
    }

    const result = await upsertFromBackfill({
      leadEmail: String(lead.email).trim().toLowerCase(),
      leadId,
      niche,
      sequenceSlug: slug,
      status: "scheduled",
      campaignId: null,
      currentStep: types[0] ?? null,
      scheduledAt: scheduled,
      startedAt: null,
      metadata: { source: "booking_email_jobs" },
      dryRun,
    });
    if (result === "inserted") inserted += 1;
    else if (result === "updated") updated += 1;
    else skipped += 1;
  }

  const { data: replyPipelines } = await client
    .from("instantly_bypass_pipeline")
    .select("lead_email, step, campaign_id")
    .eq("step", "replies_to_handle");

  for (const row of replyPipelines ?? []) {
    const slug = "reply-agent";
    const result = await upsertFromBackfill({
      leadEmail: String(row.lead_email).trim().toLowerCase(),
      leadId: null,
      niche,
      sequenceSlug: slug,
      status: "active",
      campaignId: String(row.campaign_id),
      currentStep: String(row.step),
      scheduledAt: null,
      startedAt: new Date().toISOString(),
      metadata: { source: "reply_agent_pipeline" },
      dryRun,
    });
    if (result === "inserted") inserted += 1;
    else if (result === "updated") updated += 1;
    else skipped += 1;
  }

  return { inserted, updated, skipped };
}

export async function backfillAllNiches(dryRun = false): Promise<
  Record<string, { inserted: number; updated: number; skipped: number }>
> {
  const { ALL_NICHES } = await import("@/lib/admin/navigation");
  const results: Record<string, { inserted: number; updated: number; skipped: number }> = {};
  for (const niche of ALL_NICHES) {
    results[niche] = await backfillRecipientsForNiche(niche, dryRun);
  }
  return results;
}
