import { BOOKING_CONFIRMATION_DISABLED } from "@/lib/booking-communication/confirmation-disabled";
import { dispatchDueJobsForLead } from "@/lib/booking-communication/orchestrator";
import { insertJob } from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import { renderEmailFromStore } from "@/lib/booking-communication/template-store";
import {
  createLinkTrackingClient,
  markLeadBooked,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LeadLookup, LinkTrackingLead } from "@/lib/link-tracking/types";
import { isMeetingBookedStatus } from "@/lib/link-tracking/types";

import { SEND_ALL_CONFIRM_PHRASE } from "./copy";
import { listModalitesCampaign } from "./list";
import {
  calendlyPayloadFromEventUri,
  ensureLeadSlug,
  loadLeadLookup,
  persistLeadBookingContext,
} from "./provision";
import { modalitesEnforceCancelAtFromAskSent, modalitesWarningAtFromAskSent } from "./schedule";
import type { ModalitesCandidate, ModalitesPreview } from "./types";
import { modalitesConfirmUrlFor } from "./urls";

export type ModalitesSendMode = "dry_run" | "test_send" | "send_one" | "send_all";

export type ModalitesSendResult = {
  ok: true;
  mode: ModalitesSendMode;
  sent: number;
  skippedAlreadySent: number;
  errors: Array<{ leadId: string; error: string }>;
  preview?: ModalitesPreview;
  eligible: ModalitesCandidate[];
  skipped: Awaited<ReturnType<typeof listModalitesCampaign>>["skipped"];
};

async function renderAskEmail(
  lookup: LeadLookup,
  confirmUrl: string,
): Promise<ModalitesPreview> {
  const rendered = await renderEmailFromStore({
    category: lookup.category,
    emailType: "modalites_ask",
    firstName: lookup.lead.first_name,
    scheduledAt: lookup.lead.scheduled_at,
    confirmUrl,
    useHtml: true,
  });
  return {
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    confirmUrl,
  };
}

async function prepareLeadForSend(params: {
  leadId: string;
  category: LeadCategory;
  preferredSlug?: string | null;
  inviteeUri?: string | null;
  eventUri?: string | null;
  scheduledAt?: string | null;
}): Promise<{ lookup: LeadLookup; confirmUrl: string; lead: LinkTrackingLead }> {
  const loaded = await loadLeadLookup(params.category, params.leadId);
  if (!loaded) {
    throw new Error("lead_not_found");
  }

  let lead = await ensureLeadSlug(loaded, params.preferredSlug);
  let lookup: LeadLookup = { category: params.category, lead };

  const needsPayload = !lead.calendly_payload && params.eventUri;
  const needsInvitee =
    !lead.calendly_invitee_uri?.trim() && params.inviteeUri?.trim();
  const needsScheduled = !lead.scheduled_at && params.scheduledAt;
  if (needsPayload || needsInvitee || needsScheduled) {
    lead = await persistLeadBookingContext(lookup, {
      calendlyInviteeUri: needsInvitee ? params.inviteeUri : undefined,
      calendlyPayload: needsPayload
        ? calendlyPayloadFromEventUri(params.eventUri!)
        : undefined,
      scheduledAt: needsScheduled ? params.scheduledAt : undefined,
    });
    lookup = { category: params.category, lead };
  }

  if (!isMeetingBookedStatus(lead.statut) && lead.scheduled_at?.trim()) {
    const client = createLinkTrackingClient();
    const booked = await markLeadBooked(client, {
      slug: lead.slug,
      email: lead.email,
      calendlyInviteeUri: lead.calendly_invitee_uri ?? params.inviteeUri ?? "",
      scheduledAt: lead.scheduled_at ?? params.scheduledAt,
      calendlyPayload:
        lead.calendly_payload ??
        (params.eventUri ? calendlyPayloadFromEventUri(params.eventUri) : null),
      firstName: lead.first_name,
      company: lead.company,
    });
    if (booked.lookup) {
      lookup = booked.lookup;
      lead = booked.lookup.lead;
    }
  }

  return {
    lookup,
    lead,
    confirmUrl: modalitesConfirmUrlFor(lead, { autoConfirm: true }),
  };
}

async function enqueueModalitesJobs(
  lookup: LeadLookup,
  now: Date,
): Promise<void> {
  if (BOOKING_CONFIRMATION_DISABLED) {
    return;
  }

  const askSentAt = now;
  await insertJob({
    category: lookup.category,
    leadId: lookup.lead.id,
    emailType: "modalites_ask",
    scheduledFor: new Date(),
    triggeredBy: "admin_modalites",
    idempotencyKey: `modalites-ask/${lookup.lead.id}`,
    useHtml: true,
  });
  await insertJob({
    category: lookup.category,
    leadId: lookup.lead.id,
    emailType: "modalites_cancel",
    scheduledFor: modalitesWarningAtFromAskSent(askSentAt, now),
    triggeredBy: "admin_modalites",
    idempotencyKey: `modalites-warning/${lookup.lead.id}`,
    useHtml: true,
  });
  await insertJob({
    category: lookup.category,
    leadId: lookup.lead.id,
    emailType: "modalites_enforce_cancel",
    scheduledFor: modalitesEnforceCancelAtFromAskSent(askSentAt, now),
    triggeredBy: "admin_modalites",
    idempotencyKey: `modalites-enforce/${lookup.lead.id}`,
  });
  await dispatchDueJobsForLead(lookup.lead.id);
}

function findCandidate(
  eligible: ModalitesCandidate[],
  leadId: string,
): ModalitesCandidate {
  const found = eligible.find((row) => row.leadId === leadId);
  if (!found) {
    throw new Error("lead_not_eligible");
  }
  return found;
}

export async function runModalitesCampaign(params: {
  mode: ModalitesSendMode;
  leadId?: string;
  testTo?: string;
  confirmPhrase?: string;
  now?: Date;
}): Promise<ModalitesSendResult> {
  const now = params.now ?? new Date();
  const listed = await listModalitesCampaign(now);
  const errors: Array<{ leadId: string; error: string }> = [];

  if (params.mode === "dry_run") {
    const first = params.leadId
      ? listed.eligible.find((row) => row.leadId === params.leadId) ??
        listed.eligible[0]
      : listed.eligible[0];
    let preview: ModalitesPreview | undefined;
    if (first) {
      const lookup = await loadLeadLookup(first.leadCategory, first.leadId);
      if (lookup) {
        const confirmUrl =
          first.confirmUrl ||
          modalitesConfirmUrlFor({
            slug: lookup.lead.slug || "slug",
            email: lookup.lead.email,
          }, { autoConfirm: true });
        preview = await renderAskEmail(
          {
            ...lookup,
            lead: {
              ...lookup.lead,
              scheduled_at: lookup.lead.scheduled_at ?? first.scheduledAt,
            },
          },
          confirmUrl,
        );
      }
    }
    return {
      ok: true,
      mode: "dry_run",
      sent: 0,
      skippedAlreadySent: 0,
      errors,
      preview,
      eligible: listed.eligible,
      skipped: listed.skipped,
    };
  }

  if (params.mode === "test_send") {
    const to = params.testTo?.trim().toLowerCase();
    if (!to || !to.includes("@")) {
      throw new Error("testTo email required");
    }
    const target = params.leadId
      ? findCandidate(listed.eligible, params.leadId)
      : listed.eligible[0];
    if (!target) {
      throw new Error("no_eligible_lead");
    }
    const prepared = await prepareLeadForSend({
      leadId: target.leadId,
      category: target.leadCategory,
      preferredSlug: target.slug,
      inviteeUri: target.inviteeUri,
      eventUri: target.eventUri,
      scheduledAt: target.scheduledAt,
    });
    const preview = await renderAskEmail(prepared.lookup, prepared.confirmUrl);
    const sent = await sendBookingEmail({
      to,
      subject: `[TEST] ${preview.subject}`,
      text: preview.text,
      html: preview.html,
      idempotencyKey: `modalites-test/${prepared.lead.id}/${to}/${Date.now()}`,
    });
    if (!sent.ok) {
      throw new Error(sent.error);
    }
    return {
      ok: true,
      mode: "test_send",
      sent: 1,
      skippedAlreadySent: 0,
      errors,
      preview,
      eligible: listed.eligible,
      skipped: listed.skipped,
    };
  }

  const targets: ModalitesCandidate[] =
    params.mode === "send_one"
      ? [findCandidate(listed.eligible, params.leadId ?? "")]
      : listed.eligible;

  if (params.mode === "send_all") {
    if (params.confirmPhrase !== SEND_ALL_CONFIRM_PHRASE) {
      throw new Error("confirm_phrase_required");
    }
  }

  let sent = 0;
  let skippedAlreadySent = 0;
  let lastPreview: ModalitesPreview | undefined;

  for (const target of targets) {
    if (target.askStatus === "sent" || target.askStatus === "pending") {
      skippedAlreadySent += 1;
      continue;
    }
    try {
      const prepared = await prepareLeadForSend({
        leadId: target.leadId,
        category: target.leadCategory,
        preferredSlug: target.slug,
        inviteeUri: target.inviteeUri,
        eventUri: target.eventUri,
        scheduledAt: target.scheduledAt,
      });
      await enqueueModalitesJobs(prepared.lookup, now);
      lastPreview = await renderAskEmail(prepared.lookup, prepared.confirmUrl);
      sent += 1;
    } catch (err) {
      errors.push({
        leadId: target.leadId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const refreshed = await listModalitesCampaign(now);
  return {
    ok: true,
    mode: params.mode,
    sent,
    skippedAlreadySent,
    errors,
    preview: lastPreview,
    eligible: refreshed.eligible,
    skipped: refreshed.skipped,
  };
}
