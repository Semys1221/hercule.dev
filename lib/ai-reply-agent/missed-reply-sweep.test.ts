import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  listMissedIngestCandidates,
  sweepMissedRepliesForLead,
  sweepMissedReplyInboxes,
} from "./missed-reply-sweep";
import { INTERESTED_STATUS } from "./reply-gate";

const loadAiReplyConfig = vi.fn();
const listEmails = vi.fn();
const findLeadByEmailInCampaign = vi.fn();
const getBypassEventSentAt = vi.fn();
const handleInstantlyReply = vi.fn();
const resolveReplyFromEmail = vi.fn();

vi.mock("./config", () => ({
  loadAiReplyConfig: (...args: unknown[]) => loadAiReplyConfig(...args),
}));

vi.mock("@/lib/instantly-bypass/client", () => ({
  getInstantlyApiKey: () => "test-api-key",
  listEmails: (...args: unknown[]) => listEmails(...args),
  findLeadByEmailInCampaign: (...args: unknown[]) =>
    findLeadByEmailInCampaign(...args),
}));

vi.mock("@/lib/instantly-bypass/jobs", () => ({
  interestedIdempotencyKey: (campaignId: string, leadEmail: string) =>
    `interested_email1:${campaignId}:${leadEmail}`,
  getBypassEventSentAt: (...args: unknown[]) => getBypassEventSentAt(...args),
}));

vi.mock("./handler", () => ({
  handleInstantlyReply: (...args: unknown[]) => handleInstantlyReply(...args),
}));

vi.mock("./reply-from-email", () => ({
  isAutomatedSenderEmail: (email: string) => email.startsWith("noreply@"),
  resolveReplyFromEmail: (...args: unknown[]) => resolveReplyFromEmail(...args),
}));

vi.mock("./supabase", () => ({
  createAiReplyAgentClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

describe("sweepMissedReplyInboxes", () => {
  beforeEach(() => {
    loadAiReplyConfig.mockReset();
    listEmails.mockReset();
    findLeadByEmailInCampaign.mockReset();
    getBypassEventSentAt.mockReset();
    handleInstantlyReply.mockReset();
    resolveReplyFromEmail.mockReset();

    loadAiReplyConfig.mockResolvedValue({
      status: "waiting_for_replies",
    });
    findLeadByEmailInCampaign.mockResolvedValue({
      lt_interest_status: INTERESTED_STATUS,
    });
    resolveReplyFromEmail.mockResolvedValue("contact@gestionprivedc.fr");
    handleInstantlyReply.mockResolvedValue({ ok: true, aiStatus: "auto_replied" });
  });

  it("recovers alternate-sender replies not yet recorded", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-17T16:23:18.886Z");
    listEmails.mockResolvedValue([
      {
        id: "email-alt-1",
        lead: "lead@example.com",
        from_address_email: "partner@example.com",
        timestamp_email: "2026-09-18T16:17:52.000Z",
        subject: "RE: question",
        eaccount: "sender@hercule.test",
        body: { text: "Alternate reply" },
      },
    ]);

    const result = await sweepMissedReplyInboxes({
      campaignId: "camp-1",
      limit: 10,
    });

    expect(result.recovered).toBe(1);
    expect(handleInstantlyReply).toHaveBeenCalledOnce();
  });

  it("recovers same-sender post-E1 replies missed by webhook", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-17T16:23:18.886Z");
    listEmails.mockResolvedValue([
      {
        id: "email-post-e1",
        lead: "contact@gestionprivedc.fr",
        from_address_email: "contact@gestionprivedc.fr",
        timestamp_email: "2026-09-18T16:17:52.000Z",
        subject: "RE: question clients",
        eaccount: "beatrice@confiance-patrimoine.site",
        body: { text: "Post-E1 follow-up" },
      },
    ]);

    const result = await sweepMissedReplyInboxes({
      campaignId: "camp-1",
      limit: 10,
    });

    expect(result.recovered).toBe(1);
    expect(result.skippedSameSenderPreE1).toBe(0);
    expect(handleInstantlyReply).toHaveBeenCalledOnce();
  });

  it("skips same-sender pre-E1 replies", async () => {
    getBypassEventSentAt.mockResolvedValue("2026-09-17T16:23:18.886Z");
    listEmails.mockResolvedValue([
      {
        id: "email-pre-e1",
        lead: "contact@gestionprivedc.fr",
        from_address_email: "contact@gestionprivedc.fr",
        timestamp_email: "2026-09-17T15:47:18.710Z",
        subject: "RE: question clients",
        eaccount: "beatrice@confiance-patrimoine.site",
        body: { text: "Interested reply before E1" },
      },
    ]);

    const result = await sweepMissedReplyInboxes({
      campaignId: "camp-1",
      limit: 10,
    });

    expect(result.recovered).toBe(0);
    expect(result.skippedSameSenderPreE1).toBe(1);
    expect(handleInstantlyReply).not.toHaveBeenCalled();
  });
});

describe("sweepMissedRepliesForLead", () => {
  beforeEach(() => {
    loadAiReplyConfig.mockReset();
    listEmails.mockReset();
    findLeadByEmailInCampaign.mockReset();
    getBypassEventSentAt.mockReset();
    handleInstantlyReply.mockReset();
    resolveReplyFromEmail.mockReset();

    loadAiReplyConfig.mockResolvedValue({
      status: "waiting_for_replies",
    });
    findLeadByEmailInCampaign.mockResolvedValue({
      lt_interest_status: INTERESTED_STATUS,
    });
    resolveReplyFromEmail.mockResolvedValue("contact@gestionprivedc.fr");
    handleInstantlyReply.mockResolvedValue({ ok: true, aiStatus: "auto_replied" });
    getBypassEventSentAt.mockResolvedValue("2026-09-17T16:23:18.886Z");
  });

  it("searches Instantly by lead email and ingests post-E1 reply", async () => {
    listEmails.mockResolvedValue([
      {
        id: "email-post-e1",
        lead: "contact@gestionprivedc.fr",
        from_address_email: "contact@gestionprivedc.fr",
        timestamp_email: "2026-09-18T16:17:52.000Z",
        subject: "RE: question clients",
        eaccount: "beatrice@confiance-patrimoine.site",
        body: { text: "Post-E1 follow-up" },
      },
    ]);

    const result = await sweepMissedRepliesForLead({
      campaignId: "camp-1",
      leadEmail: "contact@gestionprivedc.fr",
    });

    expect(listEmails).toHaveBeenCalledWith("test-api-key", {
      campaignId: "camp-1",
      emailType: "received",
      search: "contact@gestionprivedc.fr",
      limit: 20,
    });
    expect(result.recovered).toBe(1);
  });
});

describe("listMissedIngestCandidates", () => {
  beforeEach(() => {
    loadAiReplyConfig.mockReset();
    listEmails.mockReset();
    findLeadByEmailInCampaign.mockReset();
    getBypassEventSentAt.mockReset();

    loadAiReplyConfig.mockResolvedValue({
      status: "waiting_for_replies",
    });
    findLeadByEmailInCampaign.mockResolvedValue({
      lt_interest_status: INTERESTED_STATUS,
    });
    getBypassEventSentAt.mockResolvedValue("2026-09-17T16:23:18.886Z");
  });

  it("returns post-E1 Instantly email older than 30m not in DB", async () => {
    const ts = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    listEmails.mockResolvedValue([
      {
        id: "email-missed",
        lead: "contact@gestionprivedc.fr",
        from_address_email: "contact@gestionprivedc.fr",
        timestamp_email: ts,
        subject: "RE: question",
        eaccount: "sender@hercule.test",
        body: { text: "hello" },
      },
    ]);

    const candidates = await listMissedIngestCandidates({
      campaignId: "camp-1",
      olderThanMinutes: 30,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.instantlyEmailId).toBe("email-missed");
    expect(candidates[0]?.ageMinutes).toBeGreaterThanOrEqual(30);
  });

  it("ignores Instantly email younger than 30m", async () => {
    const ts = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    listEmails.mockResolvedValue([
      {
        id: "email-fresh",
        lead: "contact@gestionprivedc.fr",
        from_address_email: "contact@gestionprivedc.fr",
        timestamp_email: ts,
        subject: "RE: question",
        eaccount: "sender@hercule.test",
        body: { text: "hello" },
      },
    ]);

    const candidates = await listMissedIngestCandidates({
      campaignId: "camp-1",
      olderThanMinutes: 30,
    });

    expect(candidates).toHaveLength(0);
  });

  it("ignores same-sender pre-E1 Instantly email", async () => {
    const ts = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    getBypassEventSentAt.mockResolvedValue(new Date().toISOString());
    listEmails.mockResolvedValue([
      {
        id: "email-pre-e1",
        lead: "contact@gestionprivedc.fr",
        from_address_email: "contact@gestionprivedc.fr",
        timestamp_email: ts,
        subject: "RE: question",
        eaccount: "sender@hercule.test",
        body: { text: "hello" },
      },
    ]);

    const candidates = await listMissedIngestCandidates({
      campaignId: "camp-1",
      olderThanMinutes: 30,
    });

    expect(candidates).toHaveLength(0);
  });
});
