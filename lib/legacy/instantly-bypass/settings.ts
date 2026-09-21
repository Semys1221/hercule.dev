import { createBypassClient } from "./supabase";

const SETTINGS_ROW_ID = 1;

export async function getWebhookAutoSendEnabled(): Promise<boolean> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_settings")
    .select("webhook_auto_send_enabled")
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load webhook settings: ${error.message}`);
  }
  return Boolean(data?.webhook_auto_send_enabled);
}

export async function setWebhookAutoSendEnabled(enabled: boolean): Promise<void> {
  const client = createBypassClient();
  const { error } = await client.from("instantly_bypass_settings").upsert(
    {
      id: SETTINGS_ROW_ID,
      webhook_auto_send_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Failed to save webhook settings: ${error.message}`);
  }
}
