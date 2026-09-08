/** Unit tests for agency preset scoring. */

import assert from "node:assert/strict";

import { composeOpportunityCards } from "@/lib/admin/funnels/compose-opportunity-cards";
import { salesQualificationDefaultValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { formatContractWindow } from "@/lib/admin/funnels/sales-preset-registry";
import {
  AGENCY_PRESET_IDS,
  AGENCY_PRESET_REASON_STRINGS,
  COMPTABLE_PRESET_REASONS,
  scoreAgency,
  scoreAgencyPresets,
} from "@/lib/admin/funnels/sales-preset-scoring";

function main() {
  const serial = scoreAgency({
    ...salesQualificationDefaultValues,
    q3: 8,
    q4: "high",
    q10: "all",
    q13: 2000,
    q20: 5,
  });
  assert.equal(serial, "serial");

  const growth = scoreAgency({
    ...salesQualificationDefaultValues,
    q1: ["google_ads", "seo"],
    q2: ["paid_acquisition", "organic_seo"],
    q19: ["acquisition", "seo", "recurring"],
    q15: 2500,
  });
  assert.equal(growth, "growth");

  const architect = scoreAgency({
    ...salesQualificationDefaultValues,
    q1: ["dev", "shopify"],
    q2: ["frontend", "backend"],
    q12: "technical",
    q19: ["development"],
  });
  assert.equal(architect, "architect");

  const comptableSerial = scoreAgencyPresets(
    {
      ...salesQualificationDefaultValues,
      q3: 8,
      q4: "high",
      q10: "all",
      q13: 2000,
      q20: 5,
    },
    "comptable",
  );
  assert.equal(comptableSerial.id, "serial");
  assert.ok(
    comptableSerial.reasons.some((reason) => reason.includes("dossiers TPE")),
    `expected comptable reasons, got ${comptableSerial.reasons.join(", ")}`,
  );

  for (const reason of AGENCY_PRESET_REASON_STRINGS) {
    assert.ok(
      COMPTABLE_PRESET_REASONS[reason],
      `missing comptable map for ${reason}`,
    );
  }

  const comptableComposeValues = {
    ...salesQualificationDefaultValues,
    q1: ["web_creation", "google_ads", "seo"],
    q19: ["one_off", "recurring", "acquisition"],
    q13: 1499,
    q14: { months3: 1499, months6: 1499, months12: 1499 },
  };
  const comptableCards = composeOpportunityCards(
    comptableComposeValues,
    "serial",
    "comptable",
  );
  assert.equal(comptableCards.length, 5);
  assert.equal(new Set(comptableCards.map((card) => card.secteur)).size, 5);
  assert.ok(
    comptableCards.some((card) => card.dureeSouhaitee.includes("tenue")),
    "expected comptable duration copy",
  );

  const composeValues = {
    ...salesQualificationDefaultValues,
    q1: ["web_creation", "seo", "google_ads"],
    q19: ["one_off", "recurring", "acquisition", "seo"],
  };

  for (const id of AGENCY_PRESET_IDS) {
    const cards = composeOpportunityCards(composeValues, id);
    assert.equal(cards.length, 5);
    for (const card of cards) {
      assert.ok(card.minDaysOffset >= 7);
      assert.ok(card.maxDaysOffset <= 35);
      assert.ok(card.maxDaysOffset > card.minDaysOffset);
    }
    const delayed = cards.filter((card) => card.maxDaysOffset >= 30);
    assert.equal(delayed.length, 1);
  }

  const window = formatContractWindow(
    { minDaysOffset: 8, maxDaysOffset: 15 },
    new Date("2026-09-07T00:00:00.000Z"),
  );
  assert.match(window, /Prêt pour contrat entre/);

  console.log("OK lib/admin/funnels/sales-preset-scoring.test.ts");
}

main();
