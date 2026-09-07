/** Unit tests for Absent ? Resend subject/thread resolution. */

import assert from "node:assert/strict";

import {
  NOT_PRESENT_SUBJECT,
  resolveNotPresentResendMail,
} from "@/lib/admin/bookings/not-present-send";

const standalone = resolveNotPresentResendMail({
  threadSubject: null,
  messageIds: [],
});
assert.equal(standalone.subject, NOT_PRESENT_SUBJECT);
assert.equal(standalone.headers, undefined);

const subjectOnly = resolveNotPresentResendMail({
  threadSubject: "Confirmation requise",
  messageIds: [],
});
assert.equal(subjectOnly.subject, NOT_PRESENT_SUBJECT);
assert.equal(subjectOnly.headers, undefined);

const threaded = resolveNotPresentResendMail({
  threadSubject: "Confirmation requise",
  messageIds: ["<msg-1@resend.dev>", "<msg-2@resend.dev>"],
});
assert.equal(threaded.subject, "Re: Confirmation requise");
assert.equal(threaded.headers?.["In-Reply-To"], "<msg-2@resend.dev>");
assert.match(threaded.headers?.References ?? "", /<msg-1@resend.dev>/);

const alreadyRe = resolveNotPresentResendMail({
  threadSubject: "Re: Confirmation requise",
  messageIds: ["<msg-1@resend.dev>"],
});
assert.equal(alreadyRe.subject, "Re: Confirmation requise");

console.log("not-present.test.ts: ok");
