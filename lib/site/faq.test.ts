/** Unit tests for FAQ loader and resolve logic. */

import assert from "node:assert/strict";

import {
  getFaqEntries,
  getPaidClientFaqEntries,
  resolveFaqForComponent,
} from "@/lib/site/faq-data";

const agenceEntries = getFaqEntries("agence");
assert.ok(agenceEntries.length >= 10);
assert.equal(agenceEntries[0].id, "faq-ag-001");

const entrepriseEntries = getFaqEntries("entreprise");
assert.equal(entrepriseEntries.length, 9);
assert.match(entrepriseEntries[0].question, /gratuit/i);

const comptableEntries = getFaqEntries("comptable");
assert.ok(comptableEntries.length >= 17);
assert.equal(comptableEntries[0].id, "faq-cp-001");
assert.match(comptableEntries[0].answer, /signaux d'intention/i);

const paidComptable = getPaidClientFaqEntries("comptable");
assert.equal(paidComptable.length, 7);
assert.equal(paidComptable[0].id, "faq-cp-004");
assert.equal(paidComptable[1].id, "faq-cp-022");
assert.match(paidComptable[1].answer, /15 et 25 jours/);
assert.match(paidComptable[2].answer, /48 h/);
assert.match(paidComptable[3].question, /refuser/i);
assert.match(paidComptable[4].question, /replanifier/i);
assert.match(paidComptable[5].answer, /10 rendez-vous qualifiés/);
assert.match(paidComptable[6].answer, /4 jours calendaires/);
assert.doesNotMatch(
  paidComptable.map((entry) => `${entry.question} ${entry.answer}`).join(" "),
  /session d'audit|Foundation|5.?000|60 jours/i,
);

const paidCif = getPaidClientFaqEntries("cif");
assert.equal(paidCif.length, 7);
assert.match(paidCif[5].answer, /15 à 20 bilans lourds/);
assert.doesNotMatch(
  paidCif.map((entry) => `${entry.question} ${entry.answer}`).join(" "),
  /session d'audit|Foundation|5.?000|60 jours/i,
);

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
