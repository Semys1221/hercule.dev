import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

import type { SequenceEditorAdapter, SequenceStep } from "../types";

const PRODUCT_EMAIL_TYPES = new Set([
  "product_calendly_welcome",
  "product_calendly_reminder",
  "product_payment_welcome",
  "upsell_email_1",
  "upsell_email_2",
  "upsell_email_3",
  "close_indecis_1",
  "close_indecis_2",
  "close_indecis_3",
  "onboarding_j0",
  "onboarding_j0_bis",
  "onboarding_j1",
  "onboarding_reminder_m10",
  "onboarding_reminder_m5",
  "onboarding_reminder_p5",
  "deliverance_search_started",
  "deliverance_d7_update",
  "deliverance_milestone",
  "deliverance_waitlist",
  "match_proposal",
  "match_proposal_followup",
  "match_booking_agence",
  "survey_rdv_entreprise",
  "survey_rdv_entreprise_followup",
  "survey_rdv_agence",
  "survey_rdv_agence_followup",
  "sold_check_j7",
  "payment_notification_client",
]);

type BookingAdapterOptions = {
  category: LeadCategory;
  emailTypes: BookingEmailType[];
  stepMeta: Array<{ id: string; label: string; delay: string }>;
};

export function createBookingAdapter(options: BookingAdapterOptions): SequenceEditorAdapter {
  const { category, emailTypes, stepMeta } = options;
  const isProductSequence = emailTypes.some((type) => PRODUCT_EMAIL_TYPES.has(type));

  const variables = isProductSequence
    ? [
        "{{firstNameLine}}",
        "{{email}}",
        "{{dashboardLink}}",
        "{{company}}",
        "{{surveyLink}}",
        "{{agenceInfo}}",
        "{{entrepriseInfo}}",
        "{{calendlyLink}}",
        "{{estimatedFirstBookingDate}}",
      ]
    : [
        "{{firstNameLine}}",
        "{{date}}",
        "{{heure}}",
        "{{confirmation_agence_link}}",
        "{{confirmLink}}",
        "{{post_booking_link}}",
      ];

  return {
    variables,
    async load() {
      const response = await fetch(`/api/admin/booking-templates/${category}`);
      const body = (await response.json()) as {
        templates?: Array<{ email_type: string; subject: string; body: string }>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      const byType = new Map(
        (body.templates ?? []).map((row) => [row.email_type, row]),
      );
      return stepMeta.map((meta, index) => {
        const emailType = emailTypes[index];
        const row = byType.get(emailType);
        return {
          id: meta.id,
          label: meta.label,
          delay: meta.delay,
          subject: row?.subject ?? "",
          body: row?.body ?? "",
          bodyFormat: "text",
        };
      });
    },
    async save(steps: SequenceStep[]) {
      const templates = steps.map((step, index) => ({
        email_type: emailTypes[index],
        subject: step.subject,
        body: step.body,
      }));
      const response = await fetch(`/api/admin/booking-templates/${category}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
    },
    async preview(stepId: string, steps: SequenceStep[]) {
      const index = stepMeta.findIndex((meta) => meta.id === stepId);
      if (index < 0) {
        throw new Error("Step introuvable");
      }
      const step = steps[index];
      const response = await fetch("/api/admin/booking-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          emailType: emailTypes[index],
          subject: step.subject,
          body: step.body,
        }),
      });
      const body = (await response.json()) as {
        subject?: string;
        text?: string;
        html?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Prévisualisation impossible");
      }
      return {
        subject: body.subject ?? step.subject,
        body: body.text ?? step.body,
        html: body.html,
      };
    },
  };
}
