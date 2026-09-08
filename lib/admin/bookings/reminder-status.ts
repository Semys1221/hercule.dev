import {
  sequenceKindForMeeting,
} from "@/lib/booking-communication/route-sequence";
import type { BookingEmailType, BookingJobStatus } from "@/lib/booking-communication/types";
import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import type { LeadCategory } from "@/lib/link-tracking/types";

const MAIN_SEQUENCE: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
];

const RECOVERY_SEQUENCE: BookingEmailType[] = ["role_seq_48", "role_seq_24"];

export const REMINDER_EMAIL_LABELS: Record<BookingEmailType, string> = {
  immediate: "Email 1 — Confirmation immédiate",
  h48_confirm: "Email 2 — H-48 confirmation",
  h24_relance: "Email 3 — H-24 relance",
  h20_cancel: "Email 4 — H-20 annulation",
  role_seq_48: "Intro Hercule (lun–mer)",
  role_seq_24: "Relance page temporaire (lun–mer)",
  product_calendly_welcome: "product_calendly_welcome",
  product_calendly_reminder: "product_calendly_reminder",
  product_payment_welcome: "product_payment_welcome",
  upsell_email_1: "upsell_email_1",
  upsell_email_2: "upsell_email_2",
  upsell_email_3: "upsell_email_3",
  close_indecis_1: "close_indecis_1",
  close_indecis_2: "close_indecis_2",
  close_indecis_3: "close_indecis_3",
  no_show_indecis_1: "no_show_indecis_1",
  no_show_indecis_2: "no_show_indecis_2",
  no_show_indecis_3: "no_show_indecis_3",
  onboarding_j0: "onboarding_j0",
  onboarding_j0_bis: "onboarding_j0_bis",
  onboarding_j1: "onboarding_j1",
  onboarding_reminder_m10: "onboarding_reminder_m10",
  onboarding_reminder_m5: "onboarding_reminder_m5",
  onboarding_reminder_p5: "onboarding_reminder_p5",
  deliverance_search_started: "deliverance_search_started",
  deliverance_d7_update: "deliverance_d7_update",
  deliverance_milestone: "deliverance_milestone",
  deliverance_waitlist: "deliverance_waitlist",
  match_proposal: "match_proposal",
  match_proposal_followup: "match_proposal_followup",
  match_booking_agence: "match_booking_agence",
  survey_rdv_entreprise: "survey_rdv_entreprise",
  survey_rdv_entreprise_followup: "survey_rdv_entreprise_followup",
  survey_rdv_agence: "survey_rdv_agence",
  survey_rdv_agence_followup: "survey_rdv_agence_followup",
  sold_check_j7: "sold_check_j7",
  payment_notification_client: "payment_notification_client",
};

export type ReminderLineStatus =
  | "live"
  | "sent"
  | "planned"
  | "cancelled"
  | "failed"
  | "absent";

export type ReminderLine = {
  emailType: BookingEmailType;
  label: string;
  status: ReminderLineStatus;
  detail: string;
};

export type ReminderMarkerTone = "live" | "complete" | "missing";

export function expectedReminderTypes(
  scheduledAt: string | null | undefined,
  category: LeadCategory,
): BookingEmailType[] {
  const kind = sequenceKindForMeeting(scheduledAt, category);
  if (kind === "recovery") {
    return RECOVERY_SEQUENCE;
  }
  if (kind === "main") {
    return category === "entreprise"
      ? MAIN_SEQUENCE.filter((type) => type !== "h20_cancel")
      : MAIN_SEQUENCE;
  }
  return [];
}

function formatParisDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function lineForJob(
  emailType: BookingEmailType,
  job: BookingEmailJobSummary,
  now = Date.now(),
): ReminderLine {
  const label = REMINDER_EMAIL_LABELS[emailType] ?? emailType;
  const scheduledAt = new Date(job.scheduled_for).getTime();

  if (job.status === "sent") {
    const when = job.sent_at ?? job.scheduled_for;
    return {
      emailType,
      label,
      status: "sent",
      detail: `Envoyé ${formatParisDateTime(when)}`,
    };
  }

  if (job.status === "cancelled") {
    return {
      emailType,
      label,
      status: "cancelled",
      detail: "Annulé",
    };
  }

  if (job.status === "failed") {
    return {
      emailType,
      label,
      status: "failed",
      detail: job.error_message?.trim()
        ? `Échec : ${job.error_message}`
        : "Échec",
    };
  }

  if (scheduledAt <= now) {
    return {
      emailType,
      label,
      status: "live",
      detail: `Live — en attente d'envoi (prévu ${formatParisDateTime(job.scheduled_for)})`,
    };
  }

  return {
    emailType,
    label,
    status: "planned",
    detail: `Planifié ${formatParisDateTime(job.scheduled_for)}`,
  };
}

export function buildReminderLines(params: {
  scheduledAt: string;
  category: LeadCategory;
  jobs: BookingEmailJobSummary[];
  now?: number;
}): ReminderLine[] {
  const expected = expectedReminderTypes(params.scheduledAt, params.category);
  const jobsByType = new Map(
    params.jobs.map((job) => [job.email_type, job] as const),
  );

  return expected.map((emailType) => {
    const job = jobsByType.get(emailType);
    if (!job) {
      return {
        emailType,
        label: REMINDER_EMAIL_LABELS[emailType] ?? emailType,
        status: "absent",
        detail: "Absent",
      };
    }
    return lineForJob(emailType, job, params.now);
  });
}

export function reminderMarkerTone(
  lines: ReminderLine[],
): ReminderMarkerTone {
  if (lines.length === 0 || lines.every((line) => line.status === "absent")) {
    return "missing";
  }
  if (lines.some((line) => line.status === "live" || line.status === "planned")) {
    return "live";
  }
  return "complete";
}

export function sequenceIsLive(lines: ReminderLine[]): boolean {
  return lines.some(
    (line) =>
      line.status === "live" ||
      line.status === "planned" ||
      line.status === "sent",
  );
}

export function reminderStatusLabel(status: ReminderLineStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "sent":
      return "Envoyé";
    case "planned":
      return "Planifié";
    case "cancelled":
      return "Annulé";
    case "failed":
      return "Échec";
    case "absent":
      return "Absent";
  }
}
