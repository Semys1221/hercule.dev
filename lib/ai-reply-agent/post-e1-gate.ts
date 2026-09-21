import { inboundIsPureInterestSignal } from "./inbound-question";

import type { E1ReplyGateResult } from "./e1-reply-gate";

export type PostE1GateResult = {
  skip: boolean;
  reason: string;
};

/**
 * After interested_email1 was dispatched, pure interest signals (CTA click,
 * short "Oui", "Mon cabinet est compatible") do not need a second AI reply.
 */
export function evaluatePostE1InterestGate(params: {
  e1ReplyGate: E1ReplyGateResult;
  inboundText: string;
}): PostE1GateResult {
  if (!params.e1ReplyGate.e1SentAt || !params.e1ReplyGate.allowReply) {
    return { skip: false, reason: "" };
  }

  if (inboundIsPureInterestSignal(params.inboundText)) {
    return {
      skip: true,
      reason: "Pure interest signal after E1 — E1 already sent the answer",
    };
  }

  return { skip: false, reason: "" };
}
