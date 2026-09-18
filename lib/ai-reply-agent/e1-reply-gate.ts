import {
  getBypassEventSentAt,
  interestedIdempotencyKey,
} from "@/lib/instantly-bypass/jobs";

import { INTERESTED_STATUS } from "./reply-gate";

export type E1ReplyGateResult = {
  allowReply: boolean;
  reason: string;
  e1SentAt: string | null;
  inboundAt: string | null;
};

export function resolveInboundTimestamp(
  webhookTimestamp: string | null | undefined,
  storedCreatedAt: string | null | undefined,
): string | null {
  const webhook = webhookTimestamp?.trim();
  if (webhook) {
    const parsed = Date.parse(webhook);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  const stored = storedCreatedAt?.trim();
  if (stored) {
    const parsed = Date.parse(stored);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

/** Max ms a pre-E1 inbound can predate E1 and still be treated as a race-condition reply. */
const PRE_E1_RACE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Interested leads: reply agent may only answer an inbound that arrived strictly
 * after interested_email1 (E1) was dispatched — not the confirmation that triggered Interested.
 *
 * `allowPreE1Race`: set true in reprocess paths where E1 is already confirmed sent.
 * Allows inbounds that arrived up to 30 minutes BEFORE E1 (race-condition replies that
 * triggered Interested before E1 was dispatched — safe to answer after the fact).
 */
export async function checkInterestedE1ReplyGate(params: {
  campaignId: string;
  leadEmail: string;
  interestStatus: number | null | undefined;
  inboundAt: string | null | undefined;
  allowPreE1Race?: boolean;
}): Promise<E1ReplyGateResult> {
  const inboundAt = resolveInboundTimestamp(params.inboundAt, null);

  if (params.interestStatus !== INTERESTED_STATUS) {
    return {
      allowReply: true,
      reason: "",
      e1SentAt: null,
      inboundAt,
    };
  }

  const e1SentAt = await getBypassEventSentAt(
    interestedIdempotencyKey(params.campaignId, params.leadEmail),
  );

  if (!e1SentAt) {
    return {
      allowReply: false,
      reason: "E1 not sent yet — reply agent waits for interested_email1",
      e1SentAt: null,
      inboundAt,
    };
  }

  if (!inboundAt) {
    return {
      allowReply: false,
      reason: "Missing inbound timestamp — wait for post-E1 reply",
      e1SentAt,
      inboundAt: null,
    };
  }

  if (inboundAt <= e1SentAt) {
    // In reprocess mode, allow if the inbound arrived within the race window before E1.
    // This covers leads whose reply triggered Interested seconds before E1 was dispatched.
    if (params.allowPreE1Race) {
      const gapMs = Date.parse(e1SentAt) - Date.parse(inboundAt);
      if (gapMs <= PRE_E1_RACE_WINDOW_MS) {
        return {
          allowReply: true,
          reason: "",
          e1SentAt,
          inboundAt,
        };
      }
    }
    return {
      allowReply: false,
      reason: "Inbound predates E1 — wait for lead reply after interested_email1",
      e1SentAt,
      inboundAt,
    };
  }

  return {
    allowReply: true,
    reason: "",
    e1SentAt,
    inboundAt,
  };
}
