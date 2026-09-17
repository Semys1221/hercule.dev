import { createBypassClient } from "./supabase";
import { upsertPipelineStep, type PipelineStep } from "./pipeline";

import type { BypassFlow } from "./types";

export async function listSentFlows(
  campaignId: string,
  leadEmail: string,
): Promise<BypassFlow[]> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_events")
    .select("flow")
    .eq("campaign_id", campaignId)
    .eq("lead_email", leadEmail.trim().toLowerCase())
    .eq("status", "sent");

  if (error) {
    throw new Error(`Failed to list sent flows: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => String(row.flow ?? ""))
    .filter(Boolean) as BypassFlow[];
}

export function deriveStepFromFlows(flows: Iterable<string>): PipelineStep {
  const sent = new Set(flows);
  if (sent.has("interested_email3") || sent.has("no_show_email2")) {
    return "step_3";
  }
  if (sent.has("interested_email2")) {
    return "step_2";
  }
  if (sent.has("interested_email1") || sent.has("no_show_email1")) {
    return "step_1";
  }
  return "step_0";
}

export async function getPipelineStep(
  campaignId: string,
  leadEmail: string,
): Promise<PipelineStep | null> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_pipeline")
    .select("step")
    .eq("campaign_id", campaignId)
    .eq("lead_email", leadEmail.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read pipeline step: ${error.message}`);
  }

  const step = data?.step;
  return typeof step === "string" ? (step as PipelineStep) : null;
}

export async function syncPipelineStepFromSentFlows(
  campaignId: string,
  leadEmail: string,
): Promise<PipelineStep> {
  const current = await getPipelineStep(campaignId, leadEmail);
  if (current === "step_4" || current === "replies_to_handle") {
    return current;
  }

  const flows = await listSentFlows(campaignId, leadEmail);
  const step = deriveStepFromFlows(flows);
  await upsertPipelineStep(campaignId, leadEmail, step);
  return step;
}
