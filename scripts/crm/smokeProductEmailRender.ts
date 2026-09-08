/** Smoke test: product/close sequence email render + forbidden copy guard. */

import assert from "node:assert/strict";

import {
  defaultBookingEmailTemplate,
  renderTemplate,
  buildFirstNameLine,
} from "@/lib/booking-communication/templates";
import type { BookingEmailType } from "@/lib/booking-communication/types";

const FORBIDDEN_COPY_SNIPPETS = ["898", "1 500 €", "1500€", "4 jours", "MEETING_10"] as const;

const PRODUCT_TYPES: BookingEmailType[] = [
  "upsell_email_1",
  "upsell_email_2",
  "upsell_email_3",
  "close_indecis_1",
  "close_indecis_2",
  "close_indecis_3",
  "no_show_indecis_1",
  "no_show_indecis_2",
  "no_show_indecis_3",
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
  "product_payment_welcome",
];

const SAMPLE_VARS: Record<string, string> = {
  firstNameLine: "Bonjour Marie,",
  dashboardLink: "https://www.hercule.dev/dashboard/example",
  reservation_agence_link: "https://www.hercule.dev/reservation/example",
  email: "marie@example.com",
  estimatedFirstBookingDate: "lundi 15 septembre 2026",
  agenceInfo: "Cabinet Example — marie@agence.example",
  entrepriseInfo: "Entreprise Example — contact@entreprise.example",
  calendlyLink: "https://calendly.com/example/meeting",
  surveyLink: "https://www.hercule.dev/survey/example-token",
  date: "mardi 9 septembre 2026",
  heure: "14:00",
};

function assertNoForbiddenCopy(label: string, text: string) {
  for (const snippet of FORBIDDEN_COPY_SNIPPETS) {
    assert.doesNotMatch(
      text,
      new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      `${label} must not contain forbidden copy: ${snippet}`,
    );
  }
}

function main() {
  for (const emailType of PRODUCT_TYPES) {
    const category =
      emailType.startsWith("match_") && emailType !== "match_booking_agence"
        ? "entreprise"
        : emailType === "sold_check_j7"
          ? "entreprise"
          : "agence";

    const template = defaultBookingEmailTemplate(category, emailType);
    const threadedNoShowFollowUp =
      emailType === "no_show_indecis_2" || emailType === "no_show_indecis_3";
    if (!threadedNoShowFollowUp) {
      assert.ok(template.subject.trim(), `${emailType} subject must not be empty`);
    }
    assert.ok(template.body.trim(), `${emailType} body must not be empty`);
    assert.ok(
      template.body.length >= 80,
      `${emailType} body should be substantive (${template.body.length} chars)`,
    );

    const rendered = renderTemplate(template.body, {
      ...SAMPLE_VARS,
      firstNameLine: buildFirstNameLine("Marie", emailType),
    });

    assertNoForbiddenCopy(emailType, `${template.subject}\n${rendered}`);

    if (emailType === "sold_check_j7") {
      assert.doesNotMatch(
        rendered,
        /{{dashboardLink}}/,
        "sold_check_j7 should not rely on dashboardLink placeholder",
      );
      assert.match(
        rendered,
        /répondre|répondez/i,
        "sold_check_j7 should invite a reply by email",
      );
      assert.doesNotMatch(
        rendered,
        /onboarding/i,
        "sold_check_j7 should avoid the word onboarding (CPY-02)",
      );
    }

    if (emailType.startsWith("upsell_")) {
      assert.match(rendered, /1\s*489/);
      assert.match(rendered, /989|2\s*967/);
    }
  }

  const entrepriseFollowup = defaultBookingEmailTemplate(
    "entreprise",
    "survey_rdv_entreprise_followup",
  ).body;
  const agenceFollowup = defaultBookingEmailTemplate(
    "agence",
    "survey_rdv_agence_followup",
  ).body;
  assert.notEqual(
    entrepriseFollowup,
    agenceFollowup,
    "survey followup bodies should differ by audience",
  );

  console.log(`smokeProductEmailRender: OK (${PRODUCT_TYPES.length} templates)`);
}

main();
