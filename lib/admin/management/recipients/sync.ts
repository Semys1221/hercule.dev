import { CONFERENCE_INVITE_JOB_TYPES } from "@/lib/booking-communication/jobs";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { Niche } from "@/lib/admin/navigation";
import { getOutreachConfigView } from "@/lib/admin/niches/outreach-config";

import { phaseForSequenceSlug, providerForSlug } from "./phase-map";
import { upsertRecipientRow } from "./queries";
import type { RecipientStatus } from "./types";

const TERMINAL_PIPELINE_STEPS = new Set(["step_4", "closed", "done"]);

function slugFromBookingEmailTypes(emailTypes: string[]): string | null {
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

export async function backfillRecipientsForNiche(
  niche: Niche,
  dryRun = false,
): Promise<{ inserted: number; skipped: number }> {
  const client = createLinkTrackingClient();
  let inserted = 0;
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
      if (dryRun) {
        inserted += 1;
        continue;
      }
      await upsertRecipientRow({
        lead_email: String(row.lead_email).trim().toLowerCase(),
        lead_id: null,
        lead_category: niche,
        phase,
        sequence_slug: slug,
        provider,
        status: "active",
        campaign_id: String(row.campaign_id),
        current_step: step,
        scheduled_at: null,
        started_at: new Date().toISOString(),
        paused_at: null,
        completed_at: null,
        stopped_reason: null,
        metadata: { backfill: "instantly_bypass_pipeline" },
      });
      inserted += 1;
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

    if (dryRun) {
      inserted += 1;
      continue;
    }

    await upsertRecipientRow({
      lead_email: String(lead.email).trim().toLowerCase(),
      lead_id: leadId,
      lead_category: niche,
      phase,
      sequence_slug: slug,
      provider,
      status: "scheduled" as RecipientStatus,
      campaign_id: null,
      current_step: types[0] ?? null,
      scheduled_at: scheduled,
      started_at: null,
      paused_at: null,
      completed_at: null,
      stopped_reason: null,
      metadata: { backfill: "booking_email_jobs" },
    });
    inserted += 1;
  }

  return { inserted, skipped };
}
