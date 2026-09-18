/**
 * Verify Interested E1 reply gate against production Supabase + handler.
 *
 * Usage:
 *   tsx --env-file=.env ./scripts/ai-reply-agent/verifyE1ReplyGate.ts
 *
 * Optional env:
 *   VERIFY_LEAD_EMAIL       default contact@gscredits.net
 *   VERIFY_CAMPAIGN_ID      default CIF campaign
 *   VERIFY_E1_SENT_AT       override E1 timestamp for gate-only check
 */

import { randomBytes } from "node:crypto";

import { handleInstantlyReply } from "@/lib/ai-reply-agent/handler";
import { checkInterestedE1ReplyGate } from "@/lib/ai-reply-agent/e1-reply-gate";
import { createAiReplyAgentClient } from "@/lib/ai-reply-agent/supabase";
import {
  getBypassEventSentAt,
  interestedIdempotencyKey,
} from "@/lib/instantly-bypass/jobs";

const DEFAULT_CAMPAIGN_ID = "e3bdb573-fe9f-437d-bd96-4ceb52869dd4";
const DEFAULT_LEAD_EMAIL = "contact@gscredits.net";
const GSCREDITS_INBOUND_AT = "2026-09-18T06:53:39.000Z";

async function assertMigrationApplied(): Promise<void> {
  const client = createAiReplyAgentClient();
  const probeId = `verify-e1-gate-${randomBytes(4).toString("hex")}`;
  const { error: insertError } = await client.from("ai_reply_agent_messages").insert({
    campaign_id: "00000000-0000-0000-0000-000000000001",
    lead_email: "verify-e1-gate@smoke.hercule.dev",
    direction: "inbound",
    body_text: "probe",
    ai_status: "skipped_waiting_e1",
    instantly_email_id: probeId,
  });

  if (insertError) {
    throw new Error(
      `Migration not applied (skipped_waiting_e1 rejected): ${insertError.message}`,
    );
  }

  await client
    .from("ai_reply_agent_messages")
    .delete()
    .eq("instantly_email_id", probeId);
}

async function main(): Promise<void> {
  const campaignId =
    process.env.VERIFY_CAMPAIGN_ID?.trim() || DEFAULT_CAMPAIGN_ID;
  const leadEmail =
    process.env.VERIFY_LEAD_EMAIL?.trim().toLowerCase() || DEFAULT_LEAD_EMAIL;
  const inboundAt = process.env.VERIFY_INBOUND_AT?.trim() || GSCREDITS_INBOUND_AT;

  await assertMigrationApplied();
  console.log("OK migration: skipped_waiting_e1 accepted");

  const e1SentAt =
    process.env.VERIFY_E1_SENT_AT?.trim() ||
    (await getBypassEventSentAt(interestedIdempotencyKey(campaignId, leadEmail)));

  const gate = await checkInterestedE1ReplyGate({
    campaignId,
    leadEmail,
    interestStatus: 1,
    inboundAt,
  });

  console.log("gate pre-E1:", {
    allowReply: gate.allowReply,
    reason: gate.reason,
    inboundAt,
    e1SentAt,
  });

  if (gate.allowReply) {
    throw new Error("Expected gate to block pre-E1 Interested inbound");
  }
  console.log("OK gate blocks pre-E1 Interested inbound");

  const postE1Gate = await checkInterestedE1ReplyGate({
    campaignId,
    leadEmail,
    interestStatus: 1,
    inboundAt: e1SentAt
      ? new Date(Date.parse(e1SentAt) + 60_000).toISOString()
      : "2099-01-01T00:00:00.000Z",
  });

  console.log("gate post-E1:", {
    allowReply: postE1Gate.allowReply,
    reason: postE1Gate.reason,
    inboundAt: postE1Gate.inboundAt,
  });

  if (!postE1Gate.allowReply) {
    throw new Error(`Expected post-E1 inbound to pass gate: ${postE1Gate.reason}`);
  }
  console.log("OK gate allows post-E1 inbound");

  const smokeEmailId = `verify-e1-gate-${randomBytes(8).toString("hex")}`;
  const handlerResult = await handleInstantlyReply({
    timestamp: inboundAt,
    event_type: "reply_received",
    campaign_id: campaignId,
    lead_email: leadEmail,
    email_account: "beatrice@socle-conseil.site",
    email_id: smokeEmailId,
    reply_subject: "Re: question clients",
    reply_text: "Vous pouvez.",
  });

  console.log("handler:", {
    ok: handlerResult.ok,
    skipped: handlerResult.skipped ?? null,
    aiStatus: handlerResult.aiStatus ?? null,
    error: handlerResult.error ?? null,
  });

  if (handlerResult.aiStatus !== "skipped_waiting_e1") {
    throw new Error(
      `Expected handler skipped_waiting_e1, got ${handlerResult.aiStatus ?? handlerResult.skipped ?? handlerResult.error}`,
    );
  }
  console.log("OK handler returns skipped_waiting_e1 for pre-E1 confirmation");

  await createAiReplyAgentClient()
    .from("ai_reply_agent_messages")
    .delete()
    .eq("instantly_email_id", smokeEmailId);

  console.log("VERIFY PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
