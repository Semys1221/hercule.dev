/** Unit tests for FAQ loader and resolve logic. */

import assert from "node:assert/strict";

import { resolveFaqForComponent, getFaqEntries } from "@/lib/site/faq-data";

const agenceEntries = getFaqEntries("agence");
assert.ok(agenceEntries.length >= 10);
assert.equal(agenceEntries[0].id, "faq-ag-001");

const entrepriseEntries = getFaqEntries("entreprise");
assert.equal(entrepriseEntries.length, 7);
assert.match(entrepriseEntries[0].question, /gratuit/i);

const resolved = resolveFaqForComponent("agence", {
  id: "faq_inst_test",
  hiddenIds: ["faq-ag-001"],
  localEntries: [
    {
      id: "local-1",
      question: "Question locale ?",
      answer: "Réponse locale.",
    },
  ],
});

assert.equal(resolved.length, agenceEntries.length);
assert.ok(!resolved.some((entry) => entry.id === "faq-ag-001"));
assert.ok(resolved.some((entry) => entry.id === "local-1"));

console.log("faq.test.ts: ok");
