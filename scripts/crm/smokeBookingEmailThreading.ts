/**
 * Smoke checks for booking email threading helpers.
 *
 * Usage: pnpm smoke-booking-email-threading
 */
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

function assertOrchestratorUsesThreading(): void {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const orchestrator = fs.readFileSync(
    path.join(process.cwd(), "lib/booking-communication/orchestrator.ts"),
    "utf8",
  );
  if (!orchestrator.includes("prepareThreadedSend")) {
    throw new Error("orchestrator.ts must use prepareThreadedSend");
  }
  if (!orchestrator.includes("buildThreadHeaders")) {
    throw new Error("orchestrator.ts must apply buildThreadHeaders");
  }
  console.log("OK static: orchestrator wires threading helpers");
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

function main(): void {
  assertReplySubject();
  assertThreadHeaders();
  assertOrchestratorUsesThreading();
  assertSendStoresMessageId();
  console.log("All booking email threading checks passed.");
}

main();
