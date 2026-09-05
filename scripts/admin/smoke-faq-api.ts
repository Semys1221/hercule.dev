/** Smoke tests for FAQ admin API route handlers. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readFaqDocument, writeFaqDocument } from "@/lib/site/faq-server";
import { faqDocumentSchema } from "@/lib/site/faq-types";

const agence = readFaqDocument("agence");
assert.equal(agence.audience, "agence");
assert.ok(agence.entries.length > 0);

const parsed = faqDocumentSchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), "content/faq/agence.json"), "utf-8")),
);
assert.deepEqual(parsed.entries.length, agence.entries.length);

const backup = { ...agence, entries: [...agence.entries] };
writeFaqDocument(agence);
const reloaded = readFaqDocument("agence");
assert.equal(reloaded.entries.length, backup.entries.length);

console.log("smoke-faq-api.ts: ok");
