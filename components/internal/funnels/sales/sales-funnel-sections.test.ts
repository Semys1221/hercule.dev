/** Unit tests for sales funnel section configuration. */

import assert from "node:assert/strict";

import { getSalesFunnelSections } from "@/components/internal/funnels/sales/sales-funnel-sections";

const AUDIENCES = ["agence", "comptable", "cif", "entreprise"] as const;

function main() {
  for (const audience of AUDIENCES) {
    const sections = getSalesFunnelSections(audience);
    assert.ok(
      !sections.some((section) => (section.id as string) === "historique"),
      `historique should be removed for ${audience}`,
    );
  }

  const comptableConditions = getSalesFunnelSections("comptable").find(
    (section) => section.id === "conditions",
  );
  assert.ok(comptableConditions?.subtitle);
  assert.ok(!/1.?799|2.?199|5.?277|Lite|Starter/i.test(comptableConditions.subtitle ?? ""));

  const cifConditions = getSalesFunnelSections("cif").find(
    (section) => section.id === "conditions",
  );
  assert.ok(cifConditions?.subtitle);
  assert.ok(!/1.?799|2.?199|5.?277|Lite|Starter/i.test(cifConditions.subtitle ?? ""));

  console.log("OK components/internal/funnels/sales/sales-funnel-sections.test.ts");
}

main();
