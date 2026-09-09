import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getEventTypeUri,
  type CalendlyBookingEvent,
} from "@/lib/calendly/availability";
import { createLinkTrackingClient, isMissingRelationError } from "@/lib/link-tracking/supabase";
import type { Niche } from "@/lib/admin/navigation";

export type NicheOutreachConfig = {
  niche: Niche;
  instantly_campaign_id: string;
  calendly_event_type_uri: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type OutreachConfigView = {
  niche: Niche;
  instantly_campaign_id: string | null;
  calendly_event_type_uri: string | null;
  resolved_calendly_event_type_uri: string | null;
  calendly_configured: boolean;
  campaign_linked: boolean;
  source: "database" | "env" | "none";
};

const CAMPAIGN_ENV: Record<Niche, string> = {
  agence: "INSTANTLY_CAMPAIGN_ID_AGENCE",
  entreprise: "INSTANTLY_CAMPAIGN_ID_ENTREPRISE",
  comptable: "INSTANTLY_CAMPAIGN_ID_COMPTABLE",
};

const CALENDLY_ENV: Record<Niche, string> = {
  agence: "CALENDLY_EVENT_TYPE_URI_AGENCE",
  entreprise: "CALENDLY_EVENT_TYPE_URI_ENTREPRISE",
  comptable: "CALENDLY_EVENT_TYPE_URI_COMPTABLE",
};

/** @internal Exported for unit tests. */
export function campaignIdFromEnv(niche: Niche): string | null {
  const primary = process.env[CAMPAIGN_ENV[niche]]?.trim();
  if (primary) {
    return primary;
  }
  if (niche === "comptable") {
    return process.env.COMPTABLE_CAMPAIGN_ID?.trim() || null;
  }
  if (niche === "entreprise") {
    return process.env.LINK_PROVISIONING_CAMPAIGN_ID?.trim() || null;
  }
  return null;
}

/** @internal Exported for unit tests. */
export function calendlyUriFromEnv(niche: Niche): string | null {
  return process.env[CALENDLY_ENV[niche]]?.trim() || null;
}

export async function getOutreachConfigRow(
  client: SupabaseClient,
  niche: Niche,
): Promise<NicheOutreachConfig | null> {
  const { data, error } = await client
    .from("niche_outreach_config")
    .select("niche, instantly_campaign_id, calendly_event_type_uri, updated_at, updated_by")
    .eq("niche", niche)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }

  return (data as NicheOutreachConfig | null) ?? null;
}

export async function getOutreachConfigView(niche: Niche): Promise<OutreachConfigView> {
  const client = createLinkTrackingClient();
  const row = await getOutreachConfigRow(client, niche);
  const envCampaignId = campaignIdFromEnv(niche);
  const envCalendlyUri = calendlyUriFromEnv(niche);

  const instantly_campaign_id = row?.instantly_campaign_id ?? envCampaignId;
  const calendly_event_type_uri = row?.calendly_event_type_uri ?? envCalendlyUri;

  let resolved_calendly_event_type_uri: string | null =
    calendly_event_type_uri?.trim() || null;

  if (!resolved_calendly_event_type_uri) {
    try {
      resolved_calendly_event_type_uri = await getEventTypeUri(niche as CalendlyBookingEvent);
    } catch {
      resolved_calendly_event_type_uri = null;
    }
  }

  const source = row ? "database" : envCampaignId || envCalendlyUri ? "env" : "none";

  return {
    niche,
    instantly_campaign_id,
    calendly_event_type_uri: row?.calendly_event_type_uri ?? envCalendlyUri,
    resolved_calendly_event_type_uri,
    calendly_configured: Boolean(resolved_calendly_event_type_uri),
    campaign_linked: Boolean(instantly_campaign_id),
    source,
  };
}

export async function resolveCalendlyEventTypeUri(
  niche: Niche,
): Promise<string | null> {
  const view = await getOutreachConfigView(niche);
  return view.resolved_calendly_event_type_uri;
}

export async function resolveInstantlyCampaignId(niche: Niche): Promise<string | null> {
  const view = await getOutreachConfigView(niche);
  return view.instantly_campaign_id;
}

export async function upsertOutreachConfig(
  niche: Niche,
  payload: {
    instantly_campaign_id: string;
    calendly_event_type_uri?: string | null;
    updated_by?: string | null;
  },
): Promise<NicheOutreachConfig> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("niche_outreach_config")
    .upsert(
      {
        niche,
        instantly_campaign_id: payload.instantly_campaign_id,
        calendly_event_type_uri: payload.calendly_event_type_uri ?? null,
        updated_at: new Date().toISOString(),
        updated_by: payload.updated_by ?? null,
      },
      { onConflict: "niche" },
    )
    .select("niche, instantly_campaign_id, calendly_event_type_uri, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as NicheOutreachConfig;
}
