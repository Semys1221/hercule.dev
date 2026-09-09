/** Unit tests for modalités campaign helpers. */

import assert from "node:assert/strict";

import {
  modalitesAskBody,
  modalitesFaqAudience,
  modalitesFormulas,
  MODALITES_AGENCE_GROWTH_TTC_CENTS,
  MODALITES_AGENCE_LAUNCH_TTC_CENTS,
  MODALITES_SUBJECT,
} from "@/lib/modalites-campaign/copy";
import { modalitesSkipReason } from "@/lib/modalites-campaign/eligibility";
import {
  isTooSoonForModalites,
  MIN_LEAD_MS,
  modalitesEnforceCancelAt,
  modalitesEnforceCancelAtFromAskSent,
  modalitesWarningAt,
  modalitesWarningAtFromAskSent,
  MODALITES_ENFORCE_AFTER_MS,
  MODALITES_WARNING_AFTER_MS,
} from "@/lib/modalites-campaign/schedule";
import { buildModalitesConfirmUrl } from "@/lib/modalites-campaign/urls";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

function main() {
  const now = new Date("2026-09-08T10:00:00.000Z");
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inTwelveHours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  assert.equal(isTooSoonForModalites(inOneHour, now), true);
  assert.equal(isTooSoonForModalites(inThreeDays, now), false);
  assert.ok(MIN_LEAD_MS === 2 * 60 * 60 * 1000);

  const warningAt = modalitesWarningAt(inThreeDays, now);
  assert.equal(
    warningAt.getTime(),
    inThreeDays.getTime() - 3 * 60 * 60 * 1000,
  );

  const enforceAt = modalitesEnforceCancelAt(inThreeDays, now);
  assert.equal(
    enforceAt.getTime(),
    inThreeDays.getTime() - 1 * 60 * 60 * 1000,
  );

  const warningNear = modalitesWarningAt(inTwelveHours, now);
  assert.equal(
    warningNear.getTime(),
    inTwelveHours.getTime() - 3 * 60 * 60 * 1000,
  );

  const inTwoHoursTen = new Date(now.getTime() + (2 * 60 + 10) * 60 * 1000);
  const warningClamped = modalitesWarningAt(inTwoHoursTen, now);
  assert.equal(warningClamped.getTime(), now.getTime());

  assert.equal(MODALITES_WARNING_AFTER_MS, 23 * 60 * 60 * 1000);
  assert.equal(MODALITES_ENFORCE_AFTER_MS, 24 * 60 * 60 * 1000);

  const warningFromAsk = modalitesWarningAtFromAskSent(now, now);
  assert.equal(
    warningFromAsk.getTime(),
    now.getTime() + MODALITES_WARNING_AFTER_MS,
  );

  const enforceFromAsk = modalitesEnforceCancelAtFromAskSent(now, now);
  assert.equal(
    enforceFromAsk.getTime(),
    now.getTime() + MODALITES_ENFORCE_AFTER_MS,
  );

  const askYesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const enforceOverdue = modalitesEnforceCancelAtFromAskSent(askYesterday, now);
  assert.equal(enforceOverdue.getTime(), now.getTime());

  assert.equal(
    modalitesSkipReason({
      scheduledAt: inThreeDays.toISOString(),
      leadId: "lead-1",
      statut: "MEETING_BOOKED",
      now,
    }),
    null,
  );
  assert.equal(
    modalitesSkipReason({
      scheduledAt: inThreeDays.toISOString(),
      leadId: null,
      statut: "MEETING_BOOKED",
      now,
    }),
    "no_lead",
  );
  assert.equal(
    modalitesSkipReason({
      scheduledAt: inThreeDays.toISOString(),
      leadId: "lead-1",
      statut: "CONFIRMED",
      now,
    }),
    "confirmed",
  );
  assert.equal(
    modalitesSkipReason({
      scheduledAt: inOneHour.toISOString(),
      leadId: "lead-1",
      statut: "MEETING_BOOKED",
      now,
    }),
    "too_soon",
  );
  assert.equal(
    modalitesSkipReason({
      scheduledAt: inThreeDays.toISOString(),
      leadId: "lead-1",
      statut: "CLICKED",
      now,
    }),
    null,
  );

  const url = buildModalitesConfirmUrl("AbC123", "Lead@Example.com");
  assert.match(url, /modalites-hercule\.html\?/);
  assert.match(url, /code=AbC123/);
  assert.match(url, /email=lead%40example\.com/);
  assert.doesNotMatch(url, /confirm=1/);

  const autoUrl = buildModalitesConfirmUrl("AbC123", "Lead@Example.com", {
    autoConfirm: true,
  });
  assert.match(autoUrl, /confirm=1/);
  assert.doesNotMatch(autoUrl, /modalites-hercule\.html\/AbC123/);

  assert.equal(modalitesFaqAudience("agence"), "agence");
  assert.equal(modalitesFaqAudience("entreprise"), "comptable");
  assert.equal(modalitesFaqAudience("comptable"), "comptable");

  assert.equal(MODALITES_SUBJECT, "Modalités d'Hercule");
  assert.equal(MODALITES_AGENCE_GROWTH_TTC_CENTS, 149_800);
  assert.equal(MODALITES_AGENCE_LAUNCH_TTC_CENTS, 99_800);

  const agenceBody = modalitesAskBody("agence");
  assert.match(agenceBody, /1\s*498/);
  assert.match(agenceBody, /998/);
  assert.match(agenceBody, /\{\{confirmation_agence_link\}\}/);

  const cabinetFormulas = modalitesFormulas("comptable");
  assert.equal(cabinetFormulas[0]?.name, "Hercule Starter");
  assert.equal(cabinetFormulas[0]?.recommended, true);
  assert.match(cabinetFormulas[0]?.detail ?? "", /1\s*499/);
  assert.equal(cabinetFormulas[1]?.name, "Hercule Lite");
  assert.equal(
    COMMERCIAL_COMPTABLE.growthGuaranteeMrrCents,
    COMMERCIAL_COMPTABLE.growthMissionsPerMonth *
      COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents,
  );
  assert.match(cabinetFormulas[0]?.detail ?? "", /3\s*000/);

  const cabinetBody = modalitesAskBody("entreprise");
  assert.match(cabinetBody, /999/);
  assert.doesNotMatch(cabinetBody, /1 498/);

  console.log("modalites-campaign.test.ts: ok");
}

main();
