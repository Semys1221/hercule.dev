import { getWebhookAutoSendEnabled } from "./settings";

/** Webhook auto-send is controlled via Supabase (Streamlit Setup toggle). */
export async function isWebhookBypassEnabled(): Promise<boolean> {
  try {
    return await getWebhookAutoSendEnabled();
  } catch (err) {
    console.error("[instantly-bypass] Failed to read webhook settings:", err);
    return false;
  }
}
