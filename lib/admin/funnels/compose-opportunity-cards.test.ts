/** Unit tests for opportunity card composition. */

import assert from "node:assert/strict";

import {
  composeOpportunityCards,
  HERCULE_FLOOR_CENTS,
  resolveBudgetFloorCents,
  validateOpportunityCardSet,
} from "@/lib/admin/funnels/compose-opportunity-cards";
import {
  classifyTailleSample,
  computeBudgetTiers,
  roundToBand,
  type TailleClass,
} from "@/lib/admin/funnels/opportunity-card-formulas";
import {
  getSalesQualificationDefaultValues,
  salesQualificationDefaultValues,
  SALES_SKIP_VALUE,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { SALES_TEST_SESSION_QUALIFICATION } from "@/lib/admin/funnels/sales-test-session-preset";
import {
  AGENCY_PRESET_IDS,
  type AgencyPresetId,
  scoreAgency,
} from "@/lib/admin/funnels/sales-preset-scoring";
import { SECTEUR_CONFIG } from "@/lib/agence/secteur-config";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

const BANNED_HYPE_PATTERNS = [
  /roas positif/i,
  /sans interruption/i,
  /\bgaranti\b/i,
  /\bassuré\b/i,
  /\bdevis\b/i,
];

function withFloor(
  values: SalesQualificationValues,
  floorEur: number,
): SalesQualificationValues {
  return {
    ...values,
    q13: floorEur,
    q14: {
      months3: floorEur,
      months6: floorEur,
      months12: floorEur,
    },
  };
}

function assertCardSetConstraints(
  cards: ReturnType<typeof composeOpportunityCards>,
  floorCents: number,
): void {
  validateOpportunityCardSet(cards, floorCents);

  assert.equal(cards.length, 5);
  assert.equal(new Set(cards.map((card) => card.secteur)).size, 5);

  for (const card of cards) {
    assert.ok(SECTEUR_CONFIG[card.secteur]);
    assert.ok(card.budgetCents >= floorCents);
    assert.ok(card.minDaysOffset >= 7);
    assert.ok(card.maxDaysOffset <= 35);
    assert.ok(card.maxDaysOffset > card.minDaysOffset);
    assert.ok(card.dureeSouhaitee.length > 0);
    assert.ok(card.horizonResultat.length > 0);
    assert.ok(card.taille.length > 0);
  }

  const budgets = cards.map((card) => card.budgetCents).sort((a, b) => a - b);
  assert.equal(budgets[0], floorCents);
  assert.ok(budgets[4] >= floorCents * 1.55);
  assert.equal(cards.filter((card) => card.budgetCents >= floorCents * 1.55).length, 1);

  const copyFields = cards.flatMap((card) => [
    card.prestation,
    card.dureeSouhaitee,
    card.horizonResultat,
    card.historiqueAgences,
  ]);
  assert.equal(new Set(copyFields).size, copyFields.length);

  for (const card of cards) {
    for (const field of [
      card.prestation,
      card.dureeSouhaitee,
      card.horizonResultat,
      card.historiqueAgences,
    ]) {
      for (const pattern of BANNED_HYPE_PATTERNS) {
        assert.ok(!pattern.test(field), `Banned pattern in: ${field}`);
      }
    }
  }
}

function main() {
  assert.equal(roundToBand(172_400), 172_500);
  assert.equal(roundToBand(199_000), 200_000);
  assert.equal(roundToBand(201_000), 200_000);
  assert.equal(roundToBand(552_000), 550_000);
  assert.equal(roundToBand(1_155_000), 1_160_000);
  assert.equal(roundToBand(1_144_000), 1_140_000);

  assert.deepEqual(computeBudgetTiers(150_000), [
    150_000, 172_500, 187_500, 210_000, 250_000,
  ]);
  assert.deepEqual(computeBudgetTiers(200_000), [
    200_000, 230_000, 250_000, 280_000, 330_000,
  ]);
  assert.deepEqual(computeBudgetTiers(500_000), [
    500_000, 575_000, 625_000, 700_000, 825_000,
  ]);
  assert.deepEqual(computeBudgetTiers(1_000_000), [
    1_000_000, 1_150_000, 1_250_000, 1_400_000, 1_650_000,
  ]);

  assert.equal(
    resolveBudgetFloorCents(salesQualificationDefaultValues, "serial"),
    HERCULE_FLOOR_CENTS,
  );
  assert.equal(
    resolveBudgetFloorCents(salesQualificationDefaultValues, "architect"),
    200_000,
  );
  assert.equal(
    resolveBudgetFloorCents(salesQualificationDefaultValues, "specialist"),
    350_000,
  );
  assert.equal(
    resolveBudgetFloorCents(salesQualificationDefaultValues, "premium"),
    500_000,
  );

  const growthFloor = resolveBudgetFloorCents(
    SALES_TEST_SESSION_QUALIFICATION,
    "growth",
  );
  assert.equal(growthFloor, 150_000);

  const growthPreset = scoreAgency(SALES_TEST_SESSION_QUALIFICATION);
  const growthCards = composeOpportunityCards(
    SALES_TEST_SESSION_QUALIFICATION,
    growthPreset,
  );
  assertCardSetConstraints(growthCards, growthFloor);

  const serialValues = {
    ...salesQualificationDefaultValues,
    q1: ["web_creation", "maintenance"],
    q11: ["tpe", "pme_small"],
    q19: ["one_off", "maintenance", "recurring"],
    q3: 8,
    q4: "high",
    q10: "all",
    q13: 1500,
    q20: 5,
  };
  const serialCards = composeOpportunityCards(serialValues, "serial");
  assertCardSetConstraints(serialCards, 150_000);

  const architectValues = {
    ...salesQualificationDefaultValues,
    q1: ["dev", "shopify"],
    q2: ["frontend", "backend"],
    q11: ["pme_small", "pme_medium"],
    q12: "technical",
    q19: ["development", "ecommerce"],
    q13: 1500,
  };
  const architectCards = composeOpportunityCards(architectValues, "architect");
  assertCardSetConstraints(architectCards, 200_000);

  const floors: Array<{ preset: AgencyPresetId; eur: number }> = [
    { preset: "serial", eur: 1_500 },
    { preset: "growth", eur: 2_000 },
    { preset: "architect", eur: 5_000 },
    { preset: "premium", eur: 10_000 },
  ];

  for (const { preset, eur } of floors) {
    const values = withFloor(
      {
        ...salesQualificationDefaultValues,
        q1: ["web_creation", "seo", "google_ads"],
        q11: ["pme_small", "pme_medium"],
        q19: ["one_off", "recurring", "acquisition", "seo"],
      },
      eur,
    );
    const floorCents = resolveBudgetFloorCents(values, preset);
    const cards = composeOpportunityCards(values, preset);
    assertCardSetConstraints(cards, floorCents);
  }

  for (const id of AGENCY_PRESET_IDS) {
    const values = {
      ...salesQualificationDefaultValues,
      q1: ["web_creation", "seo", "google_ads"],
      q19: ["one_off", "recurring", "acquisition", "seo"],
    };
    const floorCents = resolveBudgetFloorCents(values, id);
    const cards = composeOpportunityCards(values, id);
    assertCardSetConstraints(cards, floorCents);
  }

  const comptableValues = {
    ...salesQualificationDefaultValues,
    q1: ["web_creation", "google_ads", "seo"],
    q19: ["one_off", "recurring", "acquisition"],
    q13: 3600,
    q14: "monthly_12",
    q15: "included",
    q16: null,
    q17: SALES_SKIP_VALUE,
    q18: SALES_SKIP_VALUE,
  };
  const comptableFloor = resolveBudgetFloorCents(comptableValues, "serial", "comptable");
  assert.equal(comptableFloor, 360_000);
  const comptableCards = composeOpportunityCards(comptableValues, "serial", "comptable");
  assertCardSetConstraints(comptableCards, comptableFloor);
  assert.equal(new Set(comptableCards.map((card) => card.secteur)).size, 5);
  assert.ok(
    comptableCards.every((card) => card.budget.includes("/ an") || !card.budget.includes("/ mois")),
    "comptable cards should use annual honoraires, not monthly retainers",
  );

  function countTailleClasses(
    cards: ReturnType<typeof composeOpportunityCards>,
  ): Record<TailleClass, number> {
    const counts: Partial<Record<TailleClass, number>> = {};
    for (const card of cards) {
      const tailleClass = classifyTailleSample(card.taille);
      assert.ok(tailleClass, `Unknown taille sample: ${card.taille}`);
      counts[tailleClass] = (counts[tailleClass] ?? 0) + 1;
    }
    return counts as Record<TailleClass, number>;
  }

  const comptableBaseValues = {
    ...getSalesQualificationDefaultValues("comptable"),
    q1: ["web_creation", "google_ads", "seo"],
    q19: ["one_off", "recurring", "acquisition"],
    q13: 3600,
    q14: "monthly_12",
    q15: "included",
    q16: null,
    q17: SALES_SKIP_VALUE,
    q18: SALES_SKIP_VALUE,
  };

  const singleTargetCards = composeOpportunityCards(
    { ...comptableBaseValues, q11: ["tpe"] },
    "serial",
    "comptable",
  );
  assertCardSetConstraints(singleTargetCards, comptableFloor);
  assert.equal(
    singleTargetCards.filter((card) => card.taille.startsWith("TPE —")).length,
    5,
  );

  const dualTargetCards = composeOpportunityCards(
    { ...comptableBaseValues, q11: ["tpe", "pme_small"] },
    "serial",
    "comptable",
  );
  assertCardSetConstraints(dualTargetCards, comptableFloor);
  const dualCounts = countTailleClasses(dualTargetCards);
  assert.deepEqual(dualCounts, { tpe: 3, pme_small: 2 });

  const tripleTargetCards = composeOpportunityCards(
    { ...comptableBaseValues, q11: ["freelancers", "tpe", "pme_small"] },
    "serial",
    "comptable",
  );
  assertCardSetConstraints(tripleTargetCards, comptableFloor);
  const tripleCounts = countTailleClasses(tripleTargetCards);
  assert.deepEqual(tripleCounts, {
    freelancers: 2,
    tpe: 2,
    pme_small: 1,
  });

  console.log("OK lib/admin/funnels/compose-opportunity-cards.test.ts");
}

main();
