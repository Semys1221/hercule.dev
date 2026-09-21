import { createBypassClient } from "./supabase";

export type PipelineStep =
  | "step_0"
  | "step_1"
  | "step_2"
  | "step_3"
  | "step_4"
  | "replies_to_handle";

export type PipelineLeadRow = {
  campaign_id: string;
  lead_email: string;
  step: PipelineStep;
  updated_at: string;
};

export async function upsertPipelineStep(
  campaignId: string,
  leadEmail: string,
  step: PipelineStep,
): Promise<void> {
  const client = createBypassClient();
  const { error } = await client.from("instantly_bypass_pipeline").upsert(
    {
      campaign_id: campaignId,
      lead_email: leadEmail.trim().toLowerCase(),
      step,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id,lead_email" },
  );
  if (error) {
    throw new Error(`Failed to upsert pipeline step: ${error.message}`);
  }
}

export async function listPipelineLeadsByStep(
  campaignId: string,
  step: PipelineStep,
  limit = 50,
): Promise<PipelineLeadRow[]> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_pipeline")
    .select("campaign_id, lead_email, step, updated_at")
    .eq("campaign_id", campaignId)
    .eq("step", step)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list pipeline leads: ${error.message}`);
  }

  return (data ?? []) as PipelineLeadRow[];
}
