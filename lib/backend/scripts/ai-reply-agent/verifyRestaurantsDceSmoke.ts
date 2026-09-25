/**
 * Restaurants DCE smoke: E1 gate + handler (pre/post-E1) without sending Unibox mail.
 *
 * Usage:
 *   pnpm verify-restaurants-dce-smoke
 */
import { randomBytes } from "node:crypto";

import { checkInterestedE1ReplyGate } from "@/lib/legacy/ai-reply-agent/e1-reply-gate";
import { handleInstantlyReply } from "@/lib/legacy/ai-reply-agent/handler";
import { createAiReplyAgentClient } from "@/lib/legacy/ai-reply-agent/supabase";
import {
  interestedIdempotencyKey,
  recordBypassEvent,
} from "@/lib/legacy/instantly-bypass/jobs";
import { createBypassClient } from "@/lib/legacy/instantly-bypass/supabase";

const CAMPAIGN_ID = "e4f11e76-717e-4be9-a6ad-c7f0a331afb7";
const LEAD_EMAIL = "restaurants-dce-smoke@smoke.hercule.dev";
const PRE_INBOUND_AT = "2026-09-25T00:00:00.000Z";
const SIMULATED_E1_AT = "2026-09-24T12:00:00.000Z";

async function cleanupBypassEvent(): Promise<void> {
  const key = interestedIdempotencyKey(CAMPAIGN_ID, LEAD_EMAIL);
  const client = createBypassClient();
  await client.from("instantly_bypass_events").delete().eq("idempotency_key", key);
}

async function main(): Promise<void> {
  await cleanupBypassEvent();

  const preGate = await checkInterestedE1ReplyGate({
    campaignId: CAMPAIGN_ID,
    leadEmail: LEAD_EMAIL,
    interestStatus: 1,
    inboundAt: PRE_INBOUND_AT,
  });
  if (preGate.allowReply) {
    throw new Error("Expected pre-E1 gate to block");
  }
  console.log("OK gate blocks pre-E1");

  const smokeEmailId = `verify-restaurants-dce-${randomBytes(4).toString("hex")}`;
  const handlerResult = await handleInstantlyReply({
    timestamp: PRE_INBOUND_AT,
    event_type: "reply_received",
    campaign_id: CAMPAIGN_ID,
    lead_email: LEAD_EMAIL,
    email_account: "beatrice@socle-conseil.site",
    email_id: smokeEmailId,
    reply_subject: "Re: question",
    reply_text: "Oui envoyez les détails",
  });

  const blocked = new Set(["skipped_waiting_e1", "superseded_by_e1"]);
  if (!handlerResult.aiStatus || !blocked.has(handlerResult.aiStatus)) {
    throw new Error(
      `Expected handler block, got ${handlerResult.aiStatus ?? handlerResult.skipped ?? handlerResult.error}`,
    );
  }
  console.log(`OK handler blocks pre-E1 (${handlerResult.aiStatus})`);
  await createAiReplyAgentClient()
    .from("ai_reply_agent_messages")
    .delete()
    .eq("instantly_email_id", smokeEmailId);

  const key = interestedIdempotencyKey(CAMPAIGN_ID, LEAD_EMAIL);
  await recordBypassEvent({
    idempotencyKey: key,
    flow: "interested_email1",
    campaignId: CAMPAIGN_ID,
    leadEmail: LEAD_EMAIL,
    status: "sent",
    dispatchedAt: new Date(SIMULATED_E1_AT),
  });

  const postGate = await checkInterestedE1ReplyGate({
    campaignId: CAMPAIGN_ID,
    leadEmail: LEAD_EMAIL,
    interestStatus: 1,
    inboundAt: new Date(Date.parse(SIMULATED_E1_AT) + 60_000).toISOString(),
  });
  if (!postGate.allowReply) {
    throw new Error(`Post-E1 gate failed: ${postGate.reason}`);
  }
  console.log("OK gate allows post-E1 inbound");

  await cleanupBypassEvent();
  console.log("VERIFY RESTAURANTS DCE SMOKE PASSED");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await cleanupBypassEvent();
  } catch {
    // ignore cleanup errors on failure
  }
  process.exit(1);
});
