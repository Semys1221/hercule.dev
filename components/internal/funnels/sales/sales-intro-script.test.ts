/** Unit tests for sales intro script field extraction. */

import assert from "node:assert/strict";

import { isUpcomingBooking } from "@/lib/calendly/list-bookings";
import {
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

  const script = buildSalesIntroScript(booking);
  assert.match(script, /Marie, ravi de t'avoir en ligne/);
  assert.match(script, /2 à 5/);
  assert.match(script, /Trafic Payant/);
  assert.match(script, /1 500 €/);

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
