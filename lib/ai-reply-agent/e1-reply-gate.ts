import { getEmailById, getInstantlyApiKey } from "@/lib/instantly-bypass/client";
import {
  getBypassEventSentAt,
  interestedIdempotencyKey,
} from "@/lib/instantly-bypass/jobs";
import { loadBypassConfig } from "@/lib/instantly-bypass/templates";

import { inboundLooksLikeQuestion, inboundShowsInterest } from "./inbound-question";
import { INTERESTED_STATUS, isRecoveryInterestTag } from "./reply-gate";

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

export async function resolveInboundEmailTimestamp(params: {
  instantlyEmailId?: string | null;
  webhookTimestamp?: string | null;
  storedCreatedAt?: string | null;
}): Promise<string | null> {
  const emailId = params.instantlyEmailId?.trim();
  if (emailId) {
    const record = await getEmailById(getInstantlyApiKey(), emailId);
    const emailTs = record?.timestamp_email ?? record?.timestamp_created;
    if (typeof emailTs === "string" && emailTs.trim()) {
      const parsed = Date.parse(emailTs);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }
    }
  }
  return resolveInboundTimestamp(params.webhookTimestamp, params.storedCreatedAt);
}

/**
 * Interested / E1-bypass campaigns: Grok may only answer inbounds strictly after
 * interested_email1 was dispatched. Pre-E1 qualification replies are answered by E1.
 */
export async function checkInterestedE1ReplyGate(params: {
  campaignId: string;
  leadEmail: string;
  interestStatus: number | null | undefined;
  inboundAt: string | null | undefined;
  inboundText?: string;
}): Promise<E1ReplyGateResult> {
  const inboundAt = resolveInboundTimestamp(params.inboundAt, null);
  const bypass = await loadBypassConfig(params.campaignId);
  const usesE1Bypass = Boolean(bypass);

  if (!usesE1Bypass && params.interestStatus !== INTERESTED_STATUS) {
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
    const inboundText = params.inboundText ?? "";
    const qualificationReply =
      inboundShowsInterest(inboundText) || inboundLooksLikeQuestion(inboundText);
    if (usesE1Bypass && qualificationReply) {
      return {
        allowReply: false,
        reason: "E1 not sent yet — reply agent waits for interested_email1",
        e1SentAt: null,
        inboundAt,
      };
    }
    if (
      usesE1Bypass &&
      isRecoveryInterestTag(params.interestStatus) &&
      !qualificationReply
    ) {
      return {
        allowReply: true,
        reason: "",
        e1SentAt: null,
        inboundAt,
      };
    }
    if (usesE1Bypass || params.interestStatus === INTERESTED_STATUS) {
      return {
        allowReply: false,
        reason: "E1 not sent yet — reply agent waits for interested_email1",
        e1SentAt: null,
        inboundAt,
      };
    }
    return {
      allowReply: true,
      reason: "",
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
    return {
      allowReply: false,
      reason: "Inbound predates E1 — E1 is the answer; wait for post-E1 reply",
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
