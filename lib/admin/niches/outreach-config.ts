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

/** @internal Exported for unit tests. */
export function composeOutreachConfigView(params: {
  niche: Niche;
  row: NicheOutreachConfig | null;
  envCampaignId: string | null;
  envCalendlyUri: string | null;
  resolvedCalendlyFallback: string | null;
}): OutreachConfigView {
  const { niche, row, envCampaignId, envCalendlyUri, resolvedCalendlyFallback } = params;
  const instantly_campaign_id = row?.instantly_campaign_id ?? envCampaignId;
  const storedCalendlyUri = row?.calendly_event_type_uri ?? envCalendlyUri;
  const resolved_calendly_event_type_uri =
    storedCalendlyUri?.trim() || resolvedCalendlyFallback?.trim() || null;
  const source = row ? "database" : envCampaignId || envCalendlyUri ? "env" : "none";

  return {
    niche,
    instantly_campaign_id,
    calendly_event_type_uri: storedCalendlyUri,
    resolved_calendly_event_type_uri,
    calendly_configured: Boolean(resolved_calendly_event_type_uri),
    campaign_linked: Boolean(instantly_campaign_id),
    source,
  };
}

/** @internal Exported for unit tests. */
export async function getOutreachConfigViewWithClient(
  client: SupabaseClient,
  niche: Niche,
  calendlyFallback?: string | null,
): Promise<OutreachConfigView> {
  const row = await getOutreachConfigRow(client, niche);
  const envCampaignId = campaignIdFromEnv(niche);
  const envCalendlyUri = calendlyUriFromEnv(niche);

  let resolvedCalendlyFallback: string | null = null;
  if (!row?.calendly_event_type_uri?.trim() && !envCalendlyUri?.trim()) {
    if (calendlyFallback !== undefined) {
      resolvedCalendlyFallback = calendlyFallback;
    } else {
      try {
        resolvedCalendlyFallback = await getEventTypeUri(niche as CalendlyBookingEvent);
      } catch {
        resolvedCalendlyFallback = null;
      }
    }
  }

  return composeOutreachConfigView({
    niche,
    row,
    envCampaignId,
    envCalendlyUri,
    resolvedCalendlyFallback,
  });
}

export async function getOutreachConfigView(niche: Niche): Promise<OutreachConfigView> {
  const client = createLinkTrackingClient();
  return getOutreachConfigViewWithClient(client, niche);
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

/** @internal Exported for unit tests. */
export async function upsertOutreachConfigWithClient(
  client: SupabaseClient,
  niche: Niche,
  payload: {
    instantly_campaign_id: string;
    calendly_event_type_uri?: string | null;
    updated_by?: string | null;
  },
): Promise<NicheOutreachConfig> {
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

export async function upsertOutreachConfig(
  niche: Niche,
  payload: {
    instantly_campaign_id: string;
    calendly_event_type_uri?: string | null;
    updated_by?: string | null;
  },
): Promise<NicheOutreachConfig> {
  const client = createLinkTrackingClient();
  return upsertOutreachConfigWithClient(client, niche, payload);
}
