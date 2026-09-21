import { getJumVertical } from "@/lib/admin/niches/jum-verticals";
import {
  activateCampaign,
  getInstantlyApiKey,
  listActiveCampaignIds,
  pauseCampaigns,
} from "@/lib/instantly";

import { activateHerculeStack, pauseHerculeStack } from "./hercule-stack";
import { createOrchestratorClient } from "./supabase";

import type { CampaignSwitchStats, RestaurantSwitchResult } from "./types";

export const RESTAURANT_CAMPAIGN_ID = getJumVertical("restaurant").campaignId;
export const DEFAULT_RUN_KEY = "restaurant-switch-2026-09-24";

export function buildRestaurantSwitchPlan(
  activeCampaignIds: string[],
  restaurantCampaignId = RESTAURANT_CAMPAIGN_ID,
): { toPause: string[]; toActivate: string } {
  const toPause = activeCampaignIds.filter((id) => id !== restaurantCampaignId);
  return { toPause, toActivate: restaurantCampaignId };
}

function emptyStats(): CampaignSwitchStats {
  return {
    activeCampaignCount: 0,
    pausedInstantly: [],
    activatedInstantly: null,
    herculePaused: {},
    herculeActivated: { bypass: false, replyAgent: false },
    errors: [],
  };
}

async function hasSuccessfulRun(runKey: string): Promise<boolean> {
  const client = createOrchestratorClient();
  const { data, error } = await client
    .from("campaign_orchestrator_runs")
    .select("id")
    .eq("run_key", runKey)
    .eq("status", "success")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check orchestrator run: ${error.message}`);
  }

  return Boolean(data);
}

async function recordRun(
  runKey: string,
  status: "success" | "failed",
  details: CampaignSwitchStats,
): Promise<void> {
  const client = createOrchestratorClient();
  const { error } = await client.from("campaign_orchestrator_runs").insert({
    run_key: runKey,
    status,
    details,
  });

  if (error) {
    throw new Error(`Failed to record orchestrator run: ${error.message}`);
  }
}

export async function runRestaurantSwitch(options?: {
  dryRun?: boolean;
  runKey?: string;
  restaurantCampaignId?: string;
}): Promise<RestaurantSwitchResult> {
  const dryRun = options?.dryRun ?? false;
  const runKey = options?.runKey?.trim() || DEFAULT_RUN_KEY;
  const restaurantCampaignId =
    options?.restaurantCampaignId?.trim() || RESTAURANT_CAMPAIGN_ID;

  if (!dryRun && (await hasSuccessfulRun(runKey))) {
    return {
      ok: true,
      skipped: "already_ran",
      runKey,
      stats: emptyStats(),
    };
  }

  const apiKey = getInstantlyApiKey();
  const activeCampaignIds = await listActiveCampaignIds(apiKey);
  const { toPause } = buildRestaurantSwitchPlan(
    activeCampaignIds,
    restaurantCampaignId,
  );

  const stats: CampaignSwitchStats = {
    activeCampaignCount: activeCampaignIds.length,
    pausedInstantly: [],
    activatedInstantly: null,
    herculePaused: {},
    herculeActivated: { bypass: false, replyAgent: false },
    errors: [],
  };

  if (dryRun) {
    stats.pausedInstantly = toPause;
    stats.activatedInstantly = restaurantCampaignId;
    return {
      ok: true,
      skipped: "dry_run",
      runKey,
      stats,
    };
  }

  const pauseResult = await pauseCampaigns(apiKey, toPause);
  stats.pausedInstantly = pauseResult.paused;
  stats.errors.push(...pauseResult.errors);

  for (const campaignId of pauseResult.paused) {
    try {
      stats.herculePaused[campaignId] = await pauseHerculeStack(campaignId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stats.errors.push(`hercule pause ${campaignId}: ${message}`);
    }
  }

  try {
    await activateCampaign(apiKey, restaurantCampaignId);
    stats.activatedInstantly = restaurantCampaignId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    stats.errors.push(`activate restaurant: ${message}`);
    await recordRun(runKey, "failed", stats);
    return {
      ok: false,
      runKey,
      stats,
      error: message,
    };
  }

  try {
    stats.herculeActivated = await activateHerculeStack(restaurantCampaignId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    stats.errors.push(`hercule activate restaurant: ${message}`);
    await recordRun(runKey, "failed", stats);
    return {
      ok: false,
      runKey,
      stats,
      error: message,
    };
  }

  await recordRun(runKey, "success", stats);
  return { ok: true, runKey, stats };
}
