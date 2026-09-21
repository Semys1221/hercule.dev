import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAiReplyAgentHealth } from "./health";

const listMissedIngestCandidates = vi.fn();
const listBypassConfigs = vi.fn();

type QueryResult = { data: unknown; error: null };

function chainableQuery(result: QueryResult) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const method of [
    "select",
    "eq",
    "lte",
    "gte",
    "in",
    "not",
    "order",
    "limit",
  ]) {
    api[method] = vi.fn(self);
  }
  // Terminal: awaitable thenable
  api.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return api;
}

let inboundOlderThan2h: unknown[] = [];
let outboundRows: unknown[] = [];
let failedRows: unknown[] = [];
let slowPendingRows: unknown[] = [];

vi.mock("./missed-reply-sweep", () => ({
  listMissedIngestCandidates: (...args: unknown[]) =>
    listMissedIngestCandidates(...args),
}));

vi.mock("@/lib/legacy/instantly-bypass/templates", () => ({
  listBypassConfigs: (...args: unknown[]) => listBypassConfigs(...args),
}));

vi.mock("./supabase", () => ({
  createAiReplyAgentClient: () => ({
    from: (table: string) => {
      if (table !== "ai_reply_agent_messages") {
        return chainableQuery({ data: [], error: null });
      }
      // First health queries: failed (gte), slow pending (lte+eq pending),
      // then interested_no_outbound inbound (lte), then outbound (.in).
      // Track via call order on select chains — use a simple counter.
      return {
        select: () => {
          const state = { mode: "unknown" as string };
          const api: Record<string, unknown> = {};
          const self = () => api;
          api.eq = (col: string, val: unknown) => {
            if (col === "direction" && val === "inbound") state.mode = "inbound";
            if (col === "direction" && val === "outbound") state.mode = "outbound";
            if (col === "ai_status" && val === "failed") state.mode = "failed";
            if (col === "ai_status" && val === "pending") state.mode = "slow";
            return api;
          };
          api.lte = self;
          api.gte = self;
          api.in = self;
          api.not = self;
          api.order = self;
          api.limit = () => {
            if (state.mode === "failed") {
              return Promise.resolve({ data: failedRows, error: null });
            }
            if (state.mode === "slow") {
              return Promise.resolve({ data: slowPendingRows, error: null });
            }
            if (state.mode === "outbound") {
              return Promise.resolve({ data: outboundRows, error: null });
            }
            // inbound older than 2h (interested_no_outbound)
            return Promise.resolve({ data: inboundOlderThan2h, error: null });
          };
          return api;
        },
      };
    },
  }),
}));

describe("checkAiReplyAgentHealth SLA", () => {
  beforeEach(() => {
    listMissedIngestCandidates.mockReset();
    listBypassConfigs.mockReset();
    inboundOlderThan2h = [];
    outboundRows = [];
    failedRows = [];
    slowPendingRows = [];

    listBypassConfigs.mockResolvedValue([
      { campaign_id: "camp-1", initialized_at: "2026-09-01T00:00:00Z" },
    ]);
    listMissedIngestCandidates.mockResolvedValue([]);
  });

  it("alerts on missed_ingest candidates", async () => {
    listMissedIngestCandidates.mockResolvedValue([
      {
        campaignId: "camp-1",
        leadEmail: "lead@example.com",
        instantlyEmailId: "email-1",
        emailTimestamp: "2026-09-18T16:00:00.000Z",
        ageMinutes: 45,
      },
    ]);

    const report = await checkAiReplyAgentHealth();

    expect(report.missedIngest).toBe(1);
    expect(report.alert).toBe(true);
    expect(report.issues.some((i) => i.kind === "missed_ingest")).toBe(true);
  });

  it("alerts on interested_no_outbound for pending inbound without outbound", async () => {
    inboundOlderThan2h = [
      {
        id: "msg-1",
        campaign_id: "camp-1",
        lead_email: "lead@example.com",
        ai_status: "pending",
        ai_reason: null,
        created_at: "2026-09-18T10:00:00.000Z",
      },
    ];
    outboundRows = [];

    const report = await checkAiReplyAgentHealth();

    expect(report.interestedNoOutbound).toBe(1);
    expect(report.alert).toBe(true);
    expect(
      report.issues.some((i) => i.kind === "interested_no_outbound"),
    ).toBe(true);
  });

  it("does not alert interested_no_outbound for skipped_waiting_e1 alone", async () => {
    inboundOlderThan2h = [
      {
        id: "msg-1",
        campaign_id: "camp-1",
        lead_email: "lead@example.com",
        ai_status: "skipped_waiting_e1",
        ai_reason: "wait for post-E1",
        created_at: "2026-09-18T10:00:00.000Z",
      },
    ];

    const report = await checkAiReplyAgentHealth();

    expect(report.interestedNoOutbound).toBe(0);
    expect(
      report.issues.some((i) => i.kind === "interested_no_outbound"),
    ).toBe(false);
  });
});
