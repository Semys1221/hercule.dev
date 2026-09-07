/** Unit tests for seed client guards. */

import assert from "node:assert/strict";

import { isSeedEmail, isSeedSlug, SEED_PREFIX, SEED_SLUGS } from "@/lib/admin/clients/seed";

assert.equal(SEED_PREFIX, "seed-");

assert.ok(isSeedSlug("seed-omega-design"));
assert.ok(!isSeedSlug("omega-design"));
assert.ok(!isSeedSlug(""));

assert.ok(isSeedEmail("seed-omega@example.com"));
assert.ok(!isSeedEmail("omega@example.com"));

assert.equal(SEED_SLUGS.length, 5);
for (const slug of SEED_SLUGS) {
  assert.ok(isSeedSlug(slug), `expected seed slug: ${slug}`);
}

console.log("seed.test.ts: ok");
