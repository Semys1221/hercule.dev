import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  RESTAURANT_CAMPAIGN_ID,
  buildRestaurantSwitchPlan,
  runRestaurantSwitch,
} from "./restaurant-switch";

const listActiveCampaignIds = vi.fn();
const pauseCampaigns = vi.fn();
const activateCampaign = vi.fn();
const hasSuccessfulRun = vi.fn();
const recordRun = vi.fn();
const pauseHerculeStack = vi.fn();
const activateHerculeStack = vi.fn();

vi.mock("@/lib/instantly", () => ({
  getInstantlyApiKey: () => "test-key",
  listActiveCampaignIds: (...args: unknown[]) => listActiveCampaignIds(...args),
  pauseCampaigns: (...args: unknown[]) => pauseCampaigns(...args),
  activateCampaign: (...args: unknown[]) => activateCampaign(...args),
}));

vi.mock("./supabase", () => ({
  createOrchestratorClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: hasSuccessfulRun() ? { id: "run-1" } : null,
                error: null,
              }),
          }),
        }),
      }),
      insert: (row: unknown) => {
        recordRun(row);
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

vi.mock("./hercule-stack", () => ({
  pauseHerculeStack: (...args: unknown[]) => pauseHerculeStack(...args),
  activateHerculeStack: (...args: unknown[]) => activateHerculeStack(...args),
}));

describe("buildRestaurantSwitchPlan", () => {
  it("pauses all active campaigns except restaurant", () => {
    const other = "00000000-0000-0000-0000-000000000001";
    const plan = buildRestaurantSwitchPlan(
      [RESTAURANT_CAMPAIGN_ID, other],
      RESTAURANT_CAMPAIGN_ID,
    );

    expect(plan.toPause).toEqual([other]);
    expect(plan.toActivate).toBe(RESTAURANT_CAMPAIGN_ID);
  });
});

describe("runRestaurantSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSuccessfulRun.mockReturnValue(false);
    listActiveCampaignIds.mockResolvedValue([
      RESTAURANT_CAMPAIGN_ID,
      "00000000-0000-0000-0000-000000000002",
    ]);
    pauseCampaigns.mockResolvedValue({
      paused: ["00000000-0000-0000-0000-000000000002"],
      errors: [],
    });
    activateCampaign.mockResolvedValue(undefined);
    pauseHerculeStack.mockResolvedValue({ bypass: true, replyAgent: true });
    activateHerculeStack.mockResolvedValue({ bypass: true, replyAgent: true });
  });

  it("returns dry-run plan without mutations", async () => {
    const result = await runRestaurantSwitch({ dryRun: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.skipped).toBe("dry_run");
      expect(result.stats.pausedInstantly).toEqual([
        "00000000-0000-0000-0000-000000000002",
      ]);
      expect(result.stats.activatedInstantly).toBe(RESTAURANT_CAMPAIGN_ID);
    }
    expect(pauseCampaigns).not.toHaveBeenCalled();
    expect(activateCampaign).not.toHaveBeenCalled();
    expect(recordRun).not.toHaveBeenCalled();
  });

  it("skips when run already succeeded", async () => {
    hasSuccessfulRun.mockReturnValue(true);

    const result = await runRestaurantSwitch();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.skipped).toBe("already_ran");
    }
    expect(listActiveCampaignIds).not.toHaveBeenCalled();
  });

  it("pauses others, activates restaurant, and records success", async () => {
    const result = await runRestaurantSwitch({ runKey: "test-run" });

    expect(result.ok).toBe(true);
    expect(pauseCampaigns).toHaveBeenCalledWith("test-key", [
      "00000000-0000-0000-0000-000000000002",
    ]);
    expect(activateCampaign).toHaveBeenCalledWith(
      "test-key",
      RESTAURANT_CAMPAIGN_ID,
    );
    expect(pauseHerculeStack).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000002",
    );
    expect(activateHerculeStack).toHaveBeenCalledWith(RESTAURANT_CAMPAIGN_ID);
    expect(recordRun).toHaveBeenCalledWith({
      run_key: "test-run",
      status: "success",
      details: expect.objectContaining({
        activatedInstantly: RESTAURANT_CAMPAIGN_ID,
      }),
    });
  });
});
