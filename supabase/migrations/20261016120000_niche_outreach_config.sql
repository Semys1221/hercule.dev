-- Niche outreach config: Instantly campaign + Calendly event type per niche (patch_bookings §3.3)

CREATE TABLE public.niche_outreach_config (
  niche text PRIMARY KEY CHECK (niche IN ('agence', 'comptable', 'entreprise')),
  instantly_campaign_id uuid NOT NULL,
  calendly_event_type_uri text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.niche_outreach_config ENABLE ROW LEVEL SECURITY;

CREATE INDEX niche_outreach_config_campaign_idx
  ON public.niche_outreach_config (instantly_campaign_id);

COMMENT ON TABLE public.niche_outreach_config IS
  'Per-niche Instantly campaign and Calendly event type URI for Bookings CRM.';
