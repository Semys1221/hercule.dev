-- Per-campaign delay before auto-sending interested_email1 after lead_interested webhook.

ALTER TABLE public.instantly_bypass_config
    ADD COLUMN IF NOT EXISTS e1_webhook_delay_ms INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.instantly_bypass_config.e1_webhook_delay_ms IS
    'Milliseconds after lead_interested before E1 is dispatched (0 = immediate when handler allows).';

UPDATE public.instantly_bypass_config
SET e1_webhook_delay_ms = 300000,
    updated_at = NOW()
WHERE campaign_id IN (
    'e4f11e76-717e-4be9-a6ad-c7f0a331afb7',
    '2102110d-1491-4bd0-aa24-cfd29e9a0218'
);
