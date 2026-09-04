import { createBypassClient } from "./supabase";

export type PipelineStep =
  | "step_0"
  | "step_1"
  | "step_2"
  | "step_3"
  | "replies_to_handle";

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
