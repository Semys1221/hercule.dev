import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleInstantlyReply } from "./handler";
import { REPLY_AGENT_CLIENT_SKIP_REASON } from "./client-guard";

const generateReplyDecision = vi.fn();
const findLeadByEmailInCampaign = vi.fn();
const loadAiReplyConfig = vi.fn();
const insertInboundMessage = vi.fn();
const updateInboundStatus = vi.fn();
const hasRecentHerculeCollision = vi.fn();
const getInstantlyApiKey = vi.fn();
const isReplyAgentProtectedClient = vi.fn();

vi.mock("./client-guard", () => ({
  isReplyAgentProtectedClient: (...args: unknown[]) =>
    isReplyAgentProtectedClient(...args),
  REPLY_AGENT_CLIENT_SKIP_REASON:
    "Paying client (public.clients) — reply agent disabled",
}));

vi.mock("./grok", () => ({
  generateReplyDecision: (...args: unknown[]) => generateReplyDecision(...args),
  interestLabelFromStatus: () => "Lead",
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

describe("handleInstantlyReply — paying client guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInstantlyApiKey.mockReturnValue("test-key");
    loadAiReplyConfig.mockResolvedValue(baseConfig);
    insertInboundMessage.mockResolvedValue({ id: "msg-1", duplicate: false });
    updateInboundStatus.mockResolvedValue(undefined);
    hasRecentHerculeCollision.mockResolvedValue(false);
    isReplyAgentProtectedClient.mockResolvedValue(true);
  });

  it("should not call Grok when lead email is in public.clients", async () => {
    const result = await handleInstantlyReply({
      event_type: "reply_received",
      campaign_id: "camp-1",
      lead_email: "client@example.com",
      reply_text: "Bonjour, une question sur mon contrat",
    });

    expect(isReplyAgentProtectedClient).toHaveBeenCalledWith("client@example.com");
    expect(findLeadByEmailInCampaign).not.toHaveBeenCalled();
    expect(generateReplyDecision).not.toHaveBeenCalled();
    expect(result.skipped).toBe("paying_client");
    expect(result.aiStatus).toBe("skipped_not_interested");
    expect(updateInboundStatus).toHaveBeenCalledWith(
      "msg-1",
      "skipped_not_interested",
      REPLY_AGENT_CLIENT_SKIP_REASON,
      undefined,
      undefined,
      expect.any(Number),
      undefined,
      undefined,
    );
  });
});
