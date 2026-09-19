import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  checkInterestedE1ReplyGate,
  resolveInboundTimestamp,
} from "./e1-reply-gate";
import { INTERESTED_STATUS } from "./reply-gate";

const getBypassEventSentAt = vi.fn();
const loadBypassConfig = vi.fn();

vi.mock("@/lib/instantly-bypass/jobs", () => ({
  interestedIdempotencyKey: (campaignId: string, leadEmail: string) =>
    `interested_email1:${campaignId}:${leadEmail}`,
  getBypassEventSentAt: (...args: unknown[]) => getBypassEventSentAt(...args),
}));

vi.mock("@/lib/instantly-bypass/templates", () => ({
  loadBypassConfig: (...args: unknown[]) => loadBypassConfig(...args),
}));

vi.mock("@/lib/instantly-bypass/client", () => ({
  getInstantlyApiKey: () => "test-key",
  getEmailById: vi.fn().mockResolvedValue(null),
}));

describe("checkInterestedE1ReplyGate", () => {
  beforeEach(() => {
    getBypassEventSentAt.mockReset();
    loadBypassConfig.mockReset();
    loadBypassConfig.mockResolvedValue({ campaign_id: "camp-1" });
  });

  it("allows reply for non-bypass campaigns with non-Interested tags", async () => {
    loadBypassConfig.mockResolvedValue(null);

    const result = await checkInterestedE1ReplyGate({
      campaignId: "camp-1",
      leadEmail: "lead@example.com",
      interestStatus: 0,
      inboundAt: "2026-09-18T06:53:39.000Z",
    });

    expect(result.allowReply).toBe(true);
    expect(getBypassEventSentAt).not.toHaveBeenCalled();
  });

  it("blocks bypass-campaign inbound that predates E1 regardless of Lead tag (lumea race)", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-19T10:51:57.330Z");

    const result = await checkInterestedE1ReplyGate({
      campaignId: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
      leadEmail: "contact@lumeaconsulting.fr",
      interestStatus: 0,
      inboundAt: "2026-09-19T10:51:51.000Z",
      inboundText: "Oui il est en mesure. Pouvez vous nous en dire plus ?",
    });

    expect(result.allowReply).toBe(false);
    expect(result.reason).toContain("predates E1");
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

  it("blocks bypass-campaign qualification reply before E1 is sent (interest signal)", async () => {
    getBypassEventSentAt.mockResolvedValue(null);

    const result = await checkInterestedE1ReplyGate({
      campaignId: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
      leadEmail: "lead@example.com",
      interestStatus: 0,
      inboundAt: "2026-09-19T10:51:51.000Z",
      inboundText: "Mon cabinet est compatible",
    });

    expect(result.allowReply).toBe(false);
    expect(result.reason).toContain("E1 not sent yet");
  });

  it("blocks bypass-campaign qualification question before E1 is sent (lumea pre-E1 race)", async () => {
    getBypassEventSentAt.mockResolvedValue(null);

    const result = await checkInterestedE1ReplyGate({
      campaignId: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
      leadEmail: "contact@lumeaconsulting.fr",
      interestStatus: 0,
      inboundAt: "2026-09-19T10:51:51.000Z",
      inboundText: "Oui il est en mesure. Pouvez vous nous en dire plus ?",
    });

    expect(result.allowReply).toBe(false);
    expect(result.reason).toContain("E1 not sent yet");
  });

  it("allows recovery Lead on bypass campaign when inbound is not an interest signal", async () => {
    getBypassEventSentAt.mockResolvedValue(null);

    const result = await checkInterestedE1ReplyGate({
      campaignId: "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
      leadEmail: "lead@example.com",
      interestStatus: 0,
      inboundAt: "2026-09-19T10:51:51.000Z",
      inboundText: "Bonjour, je suis disponible demain matin pour un échange.",
    });

    expect(result.allowReply).toBe(true);
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

  it("blocks when E1 has not been sent yet on Interested tag", async () => {
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
