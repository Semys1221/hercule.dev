import { cancelPendingAiReplyJobsForLead } from "@/lib/legacy/ai-reply-agent/messages";
import {
  cancelPendingJobsForLead,
  rescheduleJob,
} from "@/lib/legacy/booking-communication/jobs";
import { bookingSequenceTypesFor } from "@/lib/legacy/admin/email-sequences/registry";
import type { Niche } from "@/lib/legacy/admin/navigation";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import {
  cancelPendingBypassJobsForLead,
  rescheduleBypassJob,
} from "@/lib/legacy/instantly-bypass/scheduled-jobs";

import type { EmailSequenceRecipient } from "./types";

export async function cancelJobsForRecipient(
  recipient: EmailSequenceRecipient,
): Promise<number> {
  let cancelled = 0;

  if (recipient.provider === "resend" || recipient.provider === "hybrid") {
    if (recipient.lead_id) {
      const emailTypes = bookingSequenceTypesFor(recipient.sequence_slug, recipient.lead_category);
      if (emailTypes.length > 0) {
        cancelled += await cancelPendingJobsForLead(recipient.lead_id, emailTypes);
      }
      if (recipient.sequence_slug === "cif-conference-invite") {
        cancelled += await cancelPendingJobsForLead(recipient.lead_id, [
          "conference_invite",
          "conference_invite_24",
          "conference_invite_48",
          "conference_invite_72",
        ]);
      }
    }
  }

  if (
    (recipient.provider === "instantly" || recipient.provider === "hybrid") &&
    recipient.campaign_id
  ) {
    cancelled += await cancelPendingBypassJobsForLead(
      recipient.lead_email,
      recipient.campaign_id,
    );
    if (recipient.sequence_slug === "reply-agent") {
      cancelled += await cancelPendingAiReplyJobsForLead(
        recipient.lead_email,
        recipient.campaign_id,
      );
    }
  }

  return cancelled;
}

export async function rescheduleJobsForRecipient(
  recipient: EmailSequenceRecipient,
  scheduledAt: Date,
): Promise<boolean> {
  const client = createLinkTrackingClient();

  if (recipient.lead_id && (recipient.provider === "resend" || recipient.provider === "hybrid")) {
    const emailTypes = bookingSequenceTypesFor(recipient.sequence_slug, recipient.lead_category);
    const types =
      recipient.sequence_slug === "cif-conference-invite"
        ? ["conference_invite_24", "conference_invite_48", "conference_invite_72"]
        : emailTypes;

    if (types.length > 0) {
      const { data } = await client
        .from("booking_email_jobs")
        .select("id")
        .eq("lead_id", recipient.lead_id)
        .eq("status", "pending")
        .in("email_type", types)
        .order("scheduled_for", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        await rescheduleJob(String(data.id), scheduledAt);
        return true;
      }
    }
  }

  if (recipient.campaign_id && recipient.provider !== "resend") {
    const { data } = await client
      .from("instantly_bypass_jobs")
      .select("id")
      .eq("campaign_id", recipient.campaign_id)
      .eq("lead_email", recipient.lead_email.trim().toLowerCase())
      .eq("status", "pending")
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      await rescheduleBypassJob(String(data.id), scheduledAt);
      return true;
    }
  }

  return false;
}

export async function resumeJobsForRecipient(
  recipient: EmailSequenceRecipient,
): Promise<boolean> {
  const scheduledAt = recipient.scheduled_at
    ? new Date(recipient.scheduled_at)
    : new Date();
  if (Number.isNaN(scheduledAt.getTime())) {
    return rescheduleJobsForRecipient(recipient, new Date());
  }
  return rescheduleJobsForRecipient(recipient, scheduledAt);
}

export async function resolveCampaignIdForNiche(niche: Niche): Promise<string | null> {
  const { getOutreachConfigView } = await import("@/lib/legacy/admin/niches/outreach-config");
  const config = await getOutreachConfigView(niche);
  return config.instantly_campaign_id;
}
