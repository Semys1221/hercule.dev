/** Unit tests for session section configuration. */

import assert from "node:assert/strict";

import { getSalesFunnelSections } from "@/components/internal/funnels/sales/sales-funnel-sections";
import { SESSION_SECTION_SYSTEM_LABEL } from "@/lib/admin/funnels/ui-copy";

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
  assert.ok(comptableSections.some((section) => section.id === "pitch"));
  assert.ok(comptableSections.some((section) => section.id === "sliders"));
  assert.equal(
    comptableSections.find((section) => section.id === "pitch")?.label,
    SESSION_SECTION_SYSTEM_LABEL,
  );
  assert.equal(comptableSections.find((section) => section.id === "sliders")?.label, "Sliders");
  const slidersIndex = comptableSections.findIndex((section) => section.id === "sliders");
  const mappingIndex = comptableSections.findIndex((section) => section.id === "mapping");
  assert.ok(slidersIndex >= 0 && mappingIndex >= 0 && slidersIndex < mappingIndex);
  assert.ok(!comptableSections.some((section) => section.id === "conditions"));
  assert.equal(
    comptableSections.find((section) => section.id === "introduction")?.label,
    "Avant-propos",
  );

  const cifSections = getSalesFunnelSections("cif");
  assert.ok(cifSections.some((section) => section.id === "pitch"));
  assert.ok(cifSections.some((section) => section.id === "sliders"));
  assert.ok(!cifSections.some((section) => section.id === "standards"));
  assert.ok(cifSections.some((section) => section.id === "mapping"));
  assert.equal(cifSections.at(-1)?.id, "mapping");
  assert.equal(
    cifSections.find((section) => section.id === "introduction")?.label,
    "Avant-propos",
  );

  const agenceIntro = getSalesFunnelSections("agence").find(
    (section) => section.id === "introduction",
  );
  assert.equal(agenceIntro?.label, "Audit de compatibilité");

  const entrepriseSections = getSalesFunnelSections("entreprise");
  assert.ok(!entrepriseSections.some((section) => section.id === "mapping"));
  assert.ok(!getSalesFunnelSections("agence").some((section) => section.id === "sliders"));

  const comptableMapping = comptableSections.find((section) => section.id === "mapping");
  assert.ok(comptableMapping?.documentationOnly);
  assert.equal(comptableSections.at(-1)?.id, "mapping");

  const agenceConditions = getSalesFunnelSections("agence").find(
    (section) => section.id === "conditions",
  );
  assert.ok(agenceConditions?.subtitle);
  assert.ok(!/1.?799|2.?199|5.?277|Lite|Starter/i.test(agenceConditions.subtitle ?? ""));

  console.log("OK components/internal/funnels/sales/sales-funnel-sections.test.ts");
}

main();
