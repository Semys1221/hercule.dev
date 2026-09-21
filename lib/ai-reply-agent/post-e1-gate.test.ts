import { describe, expect, it } from "vitest";

import { evaluatePostE1InterestGate } from "./post-e1-gate";

describe("evaluatePostE1InterestGate", () => {
  it("skips pure interest after E1 was sent", () => {
    const result = evaluatePostE1InterestGate({
      e1ReplyGate: {
        allowReply: true,
        reason: "",
        e1SentAt: "2026-09-17T10:00:00.000Z",
        inboundAt: "2026-09-17T15:52:46.000Z",
      },
      inboundText: "Mon cabinet est compatible",
    });
    expect(result.skip).toBe(true);
    expect(result.reason).toContain("Pure interest");
  });

  it("does not skip when E1 not sent yet", () => {
    const result = evaluatePostE1InterestGate({
      e1ReplyGate: {
        allowReply: false,
        reason: "waiting",
        e1SentAt: null,
        inboundAt: "2026-09-17T15:52:46.000Z",
      },
      inboundText: "Mon cabinet est compatible",
    });
    expect(result.skip).toBe(false);
  });

  it("does not skip questions after E1", () => {
    const result = evaluatePostE1InterestGate({
      e1ReplyGate: {
        allowReply: true,
        reason: "",
        e1SentAt: "2026-09-17T10:00:00.000Z",
        inboundAt: "2026-09-17T15:52:46.000Z",
      },
      inboundText:
        "Avec plaisir, comment cela fonctionne-t-il et quel est le coût ?",
    });
    expect(result.skip).toBe(false);
  });
});
