/**
 * Smoke checks for booking email threading helpers.
 *
 * Usage: pnpm smoke-booking-email-threading
 */
import { BOOKING_EMAIL_TYPE_VALUES } from "@/lib/booking-communication/types";
import {
  allThreadedEmailTypes,
  isSequenceFollowUp,
  isSequenceRoot,
} from "@/lib/booking-communication/sequence-pattern";
import { buildReplySubject, buildThreadHeaders } from "@/lib/booking-communication/threading";

function assertReplySubject(): void {
  if (buildReplySubject("Confirmation de votre rendez-vous") !== "Re: Confirmation de votre rendez-vous") {
    throw new Error("buildReplySubject should prefix Re:");
  }
  if (buildReplySubject("Re: Déjà préfixé") !== "Re: Déjà préfixé") {
    throw new Error("buildReplySubject should not double-prefix Re:");
  }
  console.log("OK unit: buildReplySubject");
}

function assertThreadHeaders(): void {
  const headers = buildThreadHeaders([
    "<a@example.com>",
    "<b@example.com>",
  ]);
  if (headers["In-Reply-To"] !== "<b@example.com>") {
    throw new Error(`Unexpected In-Reply-To: ${headers["In-Reply-To"]}`);
  }
  if (headers.References !== "<a@example.com> <b@example.com>") {
    throw new Error(`Unexpected References: ${headers.References}`);
  }
  if (Object.keys(buildThreadHeaders([])).length !== 0) {
    throw new Error("Empty messageIds should produce no headers");
  }
  console.log("OK unit: buildThreadHeaders");
}

function assertSequencePatternCoversBookingTypes(): void {
  const threaded = new Set(allThreadedEmailTypes());
  const missing = BOOKING_EMAIL_TYPE_VALUES.filter((type) => !threaded.has(type));
  if (missing.length > 0) {
    throw new Error(
      `sequence-pattern.ts missing thread families for: ${missing.join(", ")}`,
    );
  }
  console.log("OK static: sequence-pattern covers all booking email types");
}

function assertThreadedSendModule(): void {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const threadedSend = fs.readFileSync(
    path.join(process.cwd(), "lib/booking-communication/threaded-send.ts"),
    "utf8",
  );
  if (!threadedSend.includes("prepareThreadedSend")) {
    throw new Error("threaded-send.ts must export prepareThreadedSend");
  }
  if (!threadedSend.includes("buildThreadHeaders")) {
    throw new Error("threaded-send.ts must apply buildThreadHeaders");
  }
  console.log("OK static: threaded-send wires threading helpers");
}

function assertSendStoresMessageId(): void {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const send = fs.readFileSync(
    path.join(process.cwd(), "lib/booking-communication/send.ts"),
    "utf8",
  );
  if (!send.includes("messageId")) {
    throw new Error("send.ts must return messageId from Resend get()");
  }
  console.log("OK static: send.ts fetches messageId");
}

function assertRootFollowUpPartition(): void {
  for (const emailType of allThreadedEmailTypes()) {
    const isRoot = isSequenceRoot(emailType);
    const isFollowUp = isSequenceFollowUp(emailType);
    if (isRoot === isFollowUp) {
      throw new Error(
        `email type must be exactly root or follow-up: ${emailType}`,
      );
    }
  }
  console.log("OK unit: root/follow-up partition");
}

function main(): void {
  assertReplySubject();
  assertThreadHeaders();
  assertSequencePatternCoversBookingTypes();
  assertRootFollowUpPartition();
  assertThreadedSendModule();
  assertSendStoresMessageId();
  console.log("All booking email threading checks passed.");
}

main();
