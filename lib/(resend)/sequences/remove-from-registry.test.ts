import assert from "node:assert/strict";

import { deleteBookingEmailTemplates } from "@/lib/(resend)/communication/template-store";
import { loadCommunicationCatalog } from "@/lib/engin/communication/load-catalog";
import { NOTIFICATION_CATALOG } from "@/lib/(resend)/notifications/catalog";
import { readNotification } from "@/lib/(resend)/notifications/file-io";
import {
  removeBookingSlugKeys,
  removeSequenceObjectBySlug,
} from "@/lib/(resend)/sequences/remove-from-registry";
import { getResendSequence, listResendBookingSequences } from "@/lib/(resend)/sequences/registry";

async function main() {
const source = `
export const RESEND_EMAIL_SEQUENCES = [
  {
    id: "keep",
    slug: "keep",
    name: "Keep",
  },
  {
    id: "drop-me",
    slug: "drop-me",
    name: "Drop",
  },
  {
    id: "after",
    slug: "after",
    name: "After",
  },
];
`;

const next = removeSequenceObjectBySlug(source, "drop-me");
assert.equal(next.includes('slug: "drop-me"'), false);
assert.equal(next.includes('slug: "keep"'), true);
assert.equal(next.includes('slug: "after"'), true);

const slugs = `
export const BOOKING_SEQUENCE_SLUGS = {
  "keep": ["immediate"],
  "drop-me": [
    "free_trial_1",
    "free_trial_2",
  ],
  "drop-me:agence": ["immediate"],
  "after": ["sold_check_j7"],
};
`;
const stripped = removeBookingSlugKeys(slugs, "drop-me");
assert.equal(stripped.includes("drop-me"), false);
assert.equal(stripped.includes('"keep"'), true);
assert.equal(stripped.includes('"after"'), true);

assert.equal(await deleteBookingEmailTemplates("agence", []), undefined);

assert.ok(getResendSequence("payment-onboarding"));
assert.ok(listResendBookingSequences().every((entry) => entry.provider === "resend"));

const catalog = loadCommunicationCatalog();
assert.ok(catalog.sequences.some((item) => item.id === "payment-onboarding"));
assert.equal(catalog.notifications.length, NOTIFICATION_CATALOG.length);
for (const entry of NOTIFICATION_CATALOG) {
  const document = readNotification(entry.id);
  assert.ok(document.subject.trim().length > 0, entry.id);
  assert.ok(document.body.trim().length > 0, entry.id);
}

console.log("remove-from-registry.test.ts: ok");
}

void main();
