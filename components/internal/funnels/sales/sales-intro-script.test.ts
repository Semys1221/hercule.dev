/** Unit tests for sales intro script field extraction. */

import assert from "node:assert/strict";

import { isUpcomingBooking } from "@/lib/calendly/list-bookings";
import {
  buildSalesIntroChecklist,
  buildSalesIntroScript,
  extractSalesIntroFields,
  SALES_DECLARATIVE_SCRIPT,
} from "@/components/internal/funnels/sales/sales-intro-script";
import { parseSalesScriptBold } from "@/components/internal/funnels/sales/sales-script-content";

function main() {
  const booking = {
    first_name: "Marie",
    name: "Marie Dupont",
    questions: {
      "Combien de salariés avez-vous ?": "2 à 5",
      "Quelles sont vos spécialités ?": "le Trafic Payant et le Dev Front-end",
      "Votre produit d'appel démarre à plus de 1 500 € ?": "Oui, plus de 1 500 €",
    },
  };

  const fields = extractSalesIntroFields(booking);
  assert.equal(fields.firstName, "Marie");
  assert.equal(fields.teamSize, "2 à 5");
  assert.equal(fields.activities, "le Trafic Payant et le Dev Front-end");
  assert.equal(fields.budgetConfirmed, true);

  const comptableBooking = {
    first_name: "Paul",
    name: "Paul Martin",
    questions: {
      "Combien d'associés ou collaborateurs compte votre cabinet ?": "5 collaborateurs",
      "Quelles missions proposez-vous ?": "Tenue comptable et fiscal",
      "Votre formule démarre-t-elle à 1 499 € / mois ?": "Oui, compatible 1 499 €",
    },
  };

  const comptableFields = extractSalesIntroFields(comptableBooking, "comptable");
  assert.equal(comptableFields.budgetConfirmed, true);

  const comptableScript = buildSalesIntroScript(comptableBooking, "comptable");
  assert.match(comptableScript, /Hercule Comptable/);
  assert.match(comptableScript, /missions TPE qui vous sont éligibles/);

  const comptableChecklist = buildSalesIntroChecklist(comptableBooking, "comptable");
  assert.match(comptableChecklist[0], /Hercule Comptable/);

  const cifBooking = {
    first_name: "Sophie",
    name: "Sophie Leroy",
    questions: {
      "Combien d'associés ou collaborateurs compte votre cabinet ?": "4 collaborateurs",
      "Quelles missions proposez-vous ?": "Patrimoine et trésorerie dirigeant",
      "Votre formule démarre-t-elle à 1 499 € / mois ?": "Oui, compatible 1 499 €",
    },
  };

  const cifScript = buildSalesIntroScript(cifBooking, "cif");
  assert.match(cifScript, /Hercule CIF/);
  assert.match(cifScript, /mandats PME qui vous sont éligibles/);
  assert.ok(!/Hercule Comptable/.test(cifScript));
  assert.ok(!/reprise comptable/.test(cifScript));

  const cifChecklist = buildSalesIntroChecklist(cifBooking, "cif");
  assert.match(cifChecklist[0], /Hercule CIF/);
  assert.match(cifChecklist[2], /patrimoine \/ trésorerie \/ transmission/);
  assert.ok(!cifChecklist.some((item) => /Hercule Comptable/.test(item)));
  assert.ok(!cifChecklist.some((item) => /tenue|paie|expert-comptable/i.test(item)));

  const script = buildSalesIntroScript(booking);
  assert.match(script, /Marie, ravi de t'avoir en ligne/);
  assert.match(script, /2 à 5/);
  assert.match(script, /Trafic Payant/);
  assert.match(script, /1 500 €/);

  const checklist = buildSalesIntroChecklist(booking);
  assert.equal(checklist.length, 8);
  assert.match(checklist[0], /Marie — en ligne — Evan \/ Hercule/);
  assert.match(checklist[1], /2 à 5/);
  assert.match(checklist[1], /Trafic Payant/);
  assert.match(checklist[5], /Brutal honesty/);
  assert.match(checklist[5], /dispute agrégateur/);
  assert.match(checklist[5], /chargeback/);
  assert.ok(!checklist.some((item) => /1 500 €/.test(item)));
  assert.ok(!checklist.some((item) => /formulaire calendly/i.test(item)));

  assert.match(SALES_DECLARATIVE_SCRIPT, /Toutes les questions restent du déclaratif/);
  assert.match(SALES_DECLARATIVE_SCRIPT, /Ça vous va \?/);
  assert.match(SALES_DECLARATIVE_SCRIPT, /\*\*on n'est plus en 2010/);

  const boldParts = parseSalesScriptBold("Hello **world**!");
  assert.equal(boldParts.length, 3);
  assert.equal(boldParts[0], "Hello ");
  assert.equal(boldParts[2], "!");

  const fallback = extractSalesIntroFields({
    first_name: null,
    name: "Jean Martin",
    questions: {},
  });
  assert.equal(fallback.firstName, "Jean");
  assert.equal(fallback.teamSize, null);
  assert.equal(fallback.activities, null);
  assert.equal(fallback.budgetConfirmed, false);

  const now = new Date("2026-09-06T10:00:00.000Z");
  assert.equal(isUpcomingBooking("2026-09-07T10:00:00.000Z", now), true);
  assert.equal(isUpcomingBooking("2026-09-05T10:00:00.000Z", now), false);

  console.log("OK components/internal/funnels/sales/sales-intro-script.test.ts");
}

main();
