import type { AiReplyMessageStatus, GroqReplyDecision } from "./types";

export const RECOVERY_CONFIDENCE_THRESHOLD = 70;

export const INTERESTED_STATUS = 1;
export const NOT_INTERESTED_STATUS = -1;
export const NO_SHOW_STATUS = -4;

export function isRecoveryInterestTag(
  status: number | null | undefined,
): boolean {
  if (status === INTERESTED_STATUS || status === NO_SHOW_STATUS) {
    return false;
  }
  return true;
}

export type ReplyGateResult = {
  allowReply: boolean;
  aiStatus: AiReplyMessageStatus;
  reason: string;
};

export function applyReplyGate(
  interestStatus: number | null | undefined,
  decision: GroqReplyDecision,
): ReplyGateResult {
  const hasText = Boolean(decision.should_reply && decision.reply_text?.trim());

  if (!hasText) {
    return {
      allowReply: false,
      aiStatus: "skipped_unsafe",
      reason: decision.reason,
    };
  }

  if (!isRecoveryInterestTag(interestStatus)) {
    return {
      allowReply: true,
      aiStatus: "auto_replied",
      reason: decision.reason,
    };
  }

  const confidence = decision.recovery_confidence;
  if (confidence == null || !Number.isFinite(confidence)) {
    return {
      allowReply: false,
      aiStatus: "skipped_recovery",
      reason: "recovery_confidence manquant pour tag Lead / Not interested",
    };
  }

  if (confidence < RECOVERY_CONFIDENCE_THRESHOLD) {
    return {
      allowReply: false,
      aiStatus: "skipped_recovery",
      reason: `Confiance récupération ${Math.round(confidence)}% < ${RECOVERY_CONFIDENCE_THRESHOLD}%`,
    };
  }

  return {
    allowReply: true,
    aiStatus: "auto_replied",
    reason: decision.reason,
  };
}
