import { describe, expect, it } from "vitest";

import {
  applyReplyGate,
  isRecoveryInterestTag,
  NOT_INTERESTED_STATUS,
  RECOVERY_CONFIDENCE_THRESHOLD,
} from "./reply-gate";

describe("isRecoveryInterestTag", () => {
  it("treats only Lead (null/other) as recovery tags", () => {
    expect(isRecoveryInterestTag(null)).toBe(true);
    expect(isRecoveryInterestTag(NOT_INTERESTED_STATUS)).toBe(false);
    expect(isRecoveryInterestTag(1)).toBe(false);
    expect(isRecoveryInterestTag(-4)).toBe(false);
  });
});

describe("applyReplyGate", () => {
  it("allows Interested without confidence gate", () => {
    const result = applyReplyGate(1, {
      should_reply: true,
      reply_text: "Bonjour",
      reason: "ok",
    });
    expect(result.allowReply).toBe(true);
    expect(result.aiStatus).toBe("auto_replied");
  });

  it("allows Lead recovery at threshold", () => {
    const result = applyReplyGate(null, {
      should_reply: true,
      reply_text: "Bonjour",
      reason: "recoverable",
      recovery_confidence: RECOVERY_CONFIDENCE_THRESHOLD,
    });
    expect(result.allowReply).toBe(true);
  });

  it("abstains when should_reply is false", () => {
    const result = applyReplyGate(null, {
      should_reply: false,
      reply_text: null,
      reason: "refus définitif",
      recovery_confidence: 10,
    });
    expect(result.allowReply).toBe(false);
    expect(result.aiStatus).toBe("skipped_unsafe");
  });
});
