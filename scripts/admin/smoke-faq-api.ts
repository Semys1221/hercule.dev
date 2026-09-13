/** Smoke tests for FAQ admin API data layer. */

import assert from "node:assert/strict";

import { faqJsonPath } from "@/lib/legal-documentation/paths";
import { readJsonFile } from "@/lib/legal-documentation/read-json";
import { readFaqDocument, writeFaqDocument } from "@/lib/site/faq-server";

const document = readFaqDocument("agence");
assert.equal(document.audience, "agence");
assert.ok(document.entries.length > 0);

const parsed = readJsonFile(faqJsonPath("agence"));
assert.equal(parsed.audience, "agence");

writeFaqDocument(document);
const reloaded = readFaqDocument("agence");
assert.equal(reloaded.entries.length, document.entries.length);

console.log("smoke-faq-api.ts: ok");
