import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  checkInterestedE1ReplyGate,
  resolveInboundTimestamp,
} from "./e1-reply-gate";
import { INTERESTED_STATUS } from "./reply-gate";

const getBypassEventSentAt = vi.fn();

vi.mock("@/lib/instantly-bypass/jobs", () => ({
  interestedIdempotencyKey: (campaignId: string, leadEmail: string) =>
    `interested_email1:${campaignId}:${leadEmail}`,
  getBypassEventSentAt: (...args: unknown[]) => getBypassEventSentAt(...args),
}));

describe("checkInterestedE1ReplyGate", () => {
  beforeEach(() => {
    getBypassEventSentAt.mockReset();
  });

  it("allows reply for non-Interested tags", async () => {
    const result = await checkInterestedE1ReplyGate({
      campaignId: "camp-1",
      leadEmail: "lead@example.com",
      interestStatus: 0,
      inboundAt: "2026-09-18T06:53:39.000Z",
    });

    expect(result.allowReply).toBe(true);
    expect(getBypassEventSentAt).not.toHaveBeenCalled();
  });

  it("blocks Interested inbound that predates E1 (dalli.be stale reprocess case)", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-11T09:10:29.841Z");

    const result = await checkInterestedE1ReplyGate({
      campaignId: "e4c58718-ca00-4e27-b714-68e522fe4db6",
      leadEmail: "info@dalli.be",
      interestStatus: INTERESTED_STATUS,
      inboundAt: "2026-09-11T09:06:02.103Z",
    });

    expect(result.allowReply).toBe(false);
    expect(result.reason).toContain("predates E1");
  });

  it("blocks Interested inbound that predates E1 (gscredits case)", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-18T06:54:10.000Z");

    const result = await checkInterestedE1ReplyGate({
      campaignId: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
      leadEmail: "contact@gscredits.net",
      interestStatus: INTERESTED_STATUS,
      inboundAt: "2026-09-18T06:53:39.000Z",
    });

    expect(result.allowReply).toBe(false);
    expect(result.reason).toContain("predates E1");
  });

  it("allows Interested inbound strictly after E1", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-18T06:54:10.000Z");

    const result = await checkInterestedE1ReplyGate({
      campaignId: "camp-1",
      leadEmail: "lead@example.com",
      interestStatus: INTERESTED_STATUS,
      inboundAt: "2026-09-18T07:10:00.000Z",
    });

    expect(result.allowReply).toBe(true);
  });

  it("blocks when E1 has not been sent yet", async () => {
    getBypassEventSentAt.mockResolvedValue(null);

    const result = await checkInterestedE1ReplyGate({
      campaignId: "camp-1",
      leadEmail: "lead@example.com",
      interestStatus: INTERESTED_STATUS,
      inboundAt: "2026-09-18T07:10:00.000Z",
    });

    expect(result.allowReply).toBe(false);
    expect(result.reason).toContain("E1 not sent yet");
  });
});

describe("resolveInboundTimestamp", () => {
  it("prefers webhook timestamp over stored created_at", () => {
    expect(
      resolveInboundTimestamp(
        "2026-09-18T06:53:39.000Z",
        "2026-09-18T06:54:22.000Z",
      ),
    ).toBe("2026-09-18T06:53:39.000Z");
  });
});
