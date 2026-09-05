/** Unit tests for shared legal markdown sources. */

import assert from "node:assert/strict";

import { buildLegalKnowledgeMarkdown } from "@/lib/site/legal-content";

const REQUIRED_ANCHORS = [
  "1 489 €",
  "14 jours ouvrés",
  "contact@hercule.dev",
  "Vercel",
  "CNIL",
  "Conditions Générales de Vente",
  "Mentions légales",
  "Politique de confidentialité",
];

const bundle = buildLegalKnowledgeMarkdown();

for (const anchor of REQUIRED_ANCHORS) {
  assert.match(bundle, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

console.log("legal-content.test.ts: ok");
