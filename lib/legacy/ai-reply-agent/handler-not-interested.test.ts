import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleInstantlyReply } from "./handler";
import { NOT_INTERESTED_STATUS } from "./reply-gate";

const generateReplyDecision = vi.fn();
const findLeadByEmailInCampaign = vi.fn();
const loadAiReplyConfig = vi.fn();
const insertInboundMessage = vi.fn();
const updateInboundStatus = vi.fn();
const hasRecentHerculeCollision = vi.fn();
const getInstantlyApiKey = vi.fn();

vi.mock("./grok", () => ({
  generateReplyDecision: (...args: unknown[]) => generateReplyDecision(...args),
  interestLabelFromStatus: (status: number | null | undefined) => {
    if (status === 1) return "Interested";
    if (status === -1) return "Not interested";
    if (status === -4) return "No show";
    return "Lead";
  },
}));

vi.mock("./config", () => ({
  loadAiReplyConfig: (...args: unknown[]) => loadAiReplyConfig(...args),
  isCampaignConfigReady: () => true,
  isAutoSendEnabled: async () => false,
}));

vi.mock("./messages", () => ({
  insertInboundMessage: (...args: unknown[]) => insertInboundMessage(...args),
  updateInboundStatus: (...args: unknown[]) => updateInboundStatus(...args),
  insertOutboundMessage: vi.fn(),
}));

vi.mock("./send", () => ({
  hasRecentHerculeCollision: (...args: unknown[]) =>
    hasRecentHerculeCollision(...args),
  sendAiReply: vi.fn(),
}));

vi.mock("@/lib/legacy/instantly-bypass/client", () => ({
  findLeadByEmailInCampaign: (...args: unknown[]) =>
    findLeadByEmailInCampaign(...args),
  getInstantlyApiKey: () => getInstantlyApiKey(),
  updateLeadInterestStatusBypass: vi.fn(),
}));

vi.mock("./knowledge", () => ({
  buildKnowledgePack: () => "knowledge",
  hashKnowledgePack: () => "hash",
}));

vi.mock("@/lib/legacy/calendly/book-from-inbound", () => ({
  bookFromInbound: vi.fn(),
  formatBookingContextForGrok: () => null,
}));

vi.mock("@/lib/legacy/link-tracking/provision-campaign-lead", () => ({
  resolveCategoryForCampaign: async () => null,
}));

vi.mock("@/lib/legacy/lead-relances/opt-out", () => ({
  detectOptOut: () => false,
}));

vi.mock("@/lib/legacy/lead-relances/stop-all", () => ({
  stopAllLeadRelances: vi.fn(),
}));

vi.mock("@/lib/legacy/instantly-bypass/sync-pipeline-from-events", () => ({
  syncPipelineStepFromSentFlows: vi.fn(),
}));

vi.mock("./lead-replies", () => ({
  upsertLeadReply: vi.fn(),
}));

vi.mock("./client-guard", () => ({
  isReplyAgentProtectedClient: async () => false,
  REPLY_AGENT_CLIENT_SKIP_REASON:
    "Paying client (public.clients) — reply agent disabled",
}));

const baseConfig = {
  id: "cfg-1",
  campaign_id: "camp-1",
  campaign_name: "Test",
  niche_preset_id: "cabinets_expertise_comptable",
  niche_metadata: {},
  target_type: "buyer" as const,
  prompt_key: "buyer",
  prompt_snapshot: "Campaign prompt",
  webhook_id: "wh-1",
  ooo_webhook_id: null,
  status: "waiting_for_replies" as const,
  max_sentences: 2,
};

describe("handleInstantlyReply — Not interested tag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInstantlyApiKey.mockReturnValue("test-key");
    loadAiReplyConfig.mockResolvedValue(baseConfig);
    insertInboundMessage.mockResolvedValue({ id: "msg-1", duplicate: false });
    updateInboundStatus.mockResolvedValue(undefined);
    hasRecentHerculeCollision.mockResolvedValue(false);
    findLeadByEmailInCampaign.mockResolvedValue({
      lt_interest_status: NOT_INTERESTED_STATUS,
    });
  });

  it("should not call Grok when lead is marked Not interested", async () => {
    const result = await handleInstantlyReply({
      event_type: "reply_received",
      campaign_id: "camp-1",
      lead_email: "lead@example.com",
      reply_text: "Non merci, pas intéressé",
    });

    expect(generateReplyDecision).not.toHaveBeenCalled();
    expect(result.skipped).toBe("not_interested");
    expect(result.aiStatus).toBe("skipped_not_interested");
  });
});
