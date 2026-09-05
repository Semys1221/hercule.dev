/** Unit tests for admin legal preview helpers. */

import assert from "node:assert/strict";

import {
  getAudienceLegalMarkdown,
  getLegalMarkdownForLeaf,
} from "@/lib/admin/legal-preview";

const agenceFaq = getAudienceLegalMarkdown("agence", "faq");
assert.match(agenceFaq, /FAQ agence/);
assert.match(agenceFaq, /Où en est ma recherche de clients/);

const entrepriseFaq = getAudienceLegalMarkdown("entreprise", "faq");
assert.match(entrepriseFaq, /FAQ entreprise/);

const cgv = getLegalMarkdownForLeaf("agence", "legal_cgv");
assert.ok(cgv);
assert.equal(cgv?.label, "CGV");
assert.ok(cgv!.markdown.length > 100);

console.log("legal-preview.test.ts: ok");
