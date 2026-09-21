/** Unit tests for session section configuration. */

import assert from "node:assert/strict";

import { getSalesFunnelSections } from "@/components/legacy/internal/funnels/sales/sales-funnel-sections";

const AUDIENCES = ["agence", "comptable", "cif", "entreprise"] as const;

function main() {
  for (const audience of AUDIENCES) {
    const sections = getSalesFunnelSections(audience);
    assert.ok(
      !sections.some((section) => (section.id as string) === "historique"),
      `historique should be removed for ${audience}`,
    );
  }

  const comptableSections = getSalesFunnelSections("comptable");
  assert.ok(comptableSections.some((section) => section.id === "presentation-societe"));
  assert.ok(comptableSections.some((section) => section.id === "capacite"));
  assert.ok(comptableSections.some((section) => section.id === "standards"));
  assert.ok(comptableSections.some((section) => section.id === "conditions"));
  assert.ok(!comptableSections.some((section) => section.id === "pitch"));
  assert.ok(!comptableSections.some((section) => section.id === "sliders"));
  assert.ok(!comptableSections.some((section) => section.id === "mapping"));
  assert.equal(
    comptableSections.find((section) => section.id === "introduction")?.label,
    "Audit de compatibilité",
  );
  assert.equal(comptableSections.at(-1)?.id, "conditions");

  const cifSections = getSalesFunnelSections("cif");
  assert.ok(cifSections.some((section) => section.id === "presentation-societe"));
  assert.ok(cifSections.some((section) => section.id === "standards"));
  assert.ok(cifSections.some((section) => section.id === "conditions"));
  assert.ok(!cifSections.some((section) => section.id === "pitch"));
  assert.ok(!cifSections.some((section) => section.id === "sliders"));
  assert.ok(!cifSections.some((section) => section.id === "mapping"));
  assert.equal(
    cifSections.find((section) => section.id === "introduction")?.label,
    "Audit de compatibilité",
  );
  assert.equal(cifSections.at(-1)?.id, "conditions");

  const agenceIntro = getSalesFunnelSections("agence").find(
    (section) => section.id === "introduction",
  );
  assert.equal(agenceIntro?.label, "Audit de compatibilité");

  const entrepriseSections = getSalesFunnelSections("entreprise");
  assert.ok(!entrepriseSections.some((section) => section.id === "mapping"));
  assert.ok(!getSalesFunnelSections("agence").some((section) => section.id === "sliders"));

  const agenceConditions = getSalesFunnelSections("agence").find(
    (section) => section.id === "conditions",
  );
  assert.ok(agenceConditions?.subtitle);
  assert.ok(!/1.?799|2.?199|5.?277|Lite|Starter/i.test(agenceConditions.subtitle ?? ""));

  console.log("OK components/internal/funnels/sales/sales-funnel-sections.test.ts");
}

main();
