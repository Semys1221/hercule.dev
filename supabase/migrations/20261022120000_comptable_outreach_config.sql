-- Seed comptable niche outreach config (Instantly campaign + Calendly event type).

INSERT INTO public.niche_outreach_config (niche, instantly_campaign_id, calendly_event_type_uri)
VALUES (
  'comptable',
  'e4c58718-ca00-4e27-b714-68e522fe4db6',
  'https://api.calendly.com/event_types/50e0a618-e5d8-4851-97ae-00940328c650'
)
ON CONFLICT (niche) DO UPDATE SET
  instantly_campaign_id = EXCLUDED.instantly_campaign_id,
  calendly_event_type_uri = EXCLUDED.calendly_event_type_uri,
  updated_at = now();
