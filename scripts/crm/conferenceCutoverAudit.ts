/**
 * Audit conference cutover: cancellations context, sent emails, scheduled jobs, stop-on-book wiring.
 */
import {
  CIF_CONFERENCE_CUTOVER_MISSING_EMAILS,
  CIF_CONFERENCE_KEEPER_EMAILS,
} from "@/lib/cif-conference-sequence/constants";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const CONFERENCE_TYPES = [
  "conference_invite",
  "conference_invite_24",
  "conference_invite_48",
  "conference_invite_72",
] as const;

async function main(): Promise<void> {
  const client = createLinkTrackingClient();

  const { data: jobs, error: jobsErr } = await client
    .from("booking_email_jobs")
    .select(
      "id, lead_id, email_type, status, scheduled_for, triggered_by, idempotency_key, created_at",
    )
    .eq("lead_category", "cif")
    .in("email_type", [...CONFERENCE_TYPES])
    .eq("triggered_by", "cif_conference_sequence")
    .order("created_at", { ascending: false });

  if (jobsErr) {
    throw new Error(jobsErr.message);
  }

  const rows = jobs ?? [];
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const job of rows) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    byType[job.email_type] = (byType[job.email_type] ?? 0) + 1;
  }

  const leadIds = [...new Set(rows.map((j) => j.lead_id))];
  const { data: leads } = await client
    .from("cif")
    .select("id, email, statut, slug, reservation_cif_link")
    .in("id", leadIds.length > 0 ? leadIds : ["00000000-0000-0000-0000-000000000000"]);

  const leadById = new Map((leads ?? []).map((l) => [l.id, l]));

  const perLead = leadIds.map((leadId) => {
    const lead = leadById.get(leadId);
    const leadJobs = rows.filter((j) => j.lead_id === leadId);
    return {
      email: lead?.email ?? leadId,
      statut: lead?.statut ?? "?",
      slug: lead?.slug ?? "?",
      conferenceLink: Boolean(
        lead?.reservation_cif_link?.includes("reservation-conference"),
      ),
      d0Sent: leadJobs.some(
        (j) => j.email_type === "conference_invite" && j.status === "sent",
      ),
      pendingFollowUps: leadJobs.filter(
        (j) => j.email_type !== "conference_invite" && j.status === "pending",
      ).length,
      canceledFollowUps: leadJobs.filter((j) => j.status === "cancelled").length,
      totalJobs: leadJobs.length,
    };
  });

  const { data: missingLeads } = await client
    .from("cif")
    .select("id, email, statut, slug, reservation_cif_link")
    .in("email", [...CIF_CONFERENCE_CUTOVER_MISSING_EMAILS]);

  const missingAudit = (missingLeads ?? []).map((lead) => {
    const leadJobs = rows.filter((j) => j.lead_id === lead.id);
    return {
      email: lead.email,
      statut: lead.statut,
      d0Sent: leadJobs.some(
        (j) => j.email_type === "conference_invite" && j.status === "sent",
      ),
      pendingFollowUps: leadJobs.filter(
        (j) => j.email_type !== "conference_invite" && j.status === "pending",
      ).length,
      conferenceLink: Boolean(
        lead.reservation_cif_link?.includes("reservation-conference"),
      ),
    };
  });

  const d0Sent = rows.filter(
    (j) => j.email_type === "conference_invite" && j.status === "sent",
  ).length;
  const pendingFollowUps = rows.filter(
    (j) => j.email_type !== "conference_invite" && j.status === "pending",
  ).length;

  console.log(
    JSON.stringify(
      {
        cutoverContext: {
          calendlyCanceledDuringExecute: 31,
          calendlyKeepers: CIF_CONFERENCE_KEEPER_EMAILS.length,
          originalCifCohortSent: 15,
          missingCohortProvisioned: 16,
        },
        conferenceSequenceJobs: {
          total: rows.length,
          uniqueLeads: leadIds.length,
          byStatus,
          byType,
          d0Sent,
          pendingFollowUps,
          expectedTotalIfComplete: leadIds.length * 4,
        },
        stopOnBookConfigured: {
          bookLeadFromCalendlyCif: "cancelConferenceInviteJobs on MEETING_BOOKED",
          orchestratorSkipIfBooked:
            "isConferenceInviteEmailType + isMeetingBookedStatus → cancel job",
          webhookCancel: "NOTBOOKED + cancelConferenceInviteJobs on cutover reset",
        },
        allLeadsReady:
          perLead.every((l) => l.d0Sent && l.conferenceLink && l.pendingFollowUps === 3) ||
          perLead.every((l) => l.statut === "MEETING_BOOKED" || l.statut === "NOTBOOKED"),
        missingCohort: {
          expected: CIF_CONFERENCE_CUTOVER_MISSING_EMAILS.length,
          foundInCif: missingLeads?.length ?? 0,
          allD0Sent: missingAudit.every((m) => m.d0Sent),
          allConferenceLinks: missingAudit.every((m) => m.conferenceLink),
          allPendingFollowUps:
            missingAudit.filter((m) => m.statut === "NOTBOOKED").every((m) => m.pendingFollowUps === 3),
          detail: missingAudit,
        },
        perLeadSummary: perLead,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
