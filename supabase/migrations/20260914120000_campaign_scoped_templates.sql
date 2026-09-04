-- Scope Instantly bypass templates per campaign and store per-campaign webhook state.

ALTER TABLE public.instantly_bypass_config
    ADD COLUMN IF NOT EXISTS webhook_id TEXT,
    ADD COLUMN IF NOT EXISTS webhook_auto_send_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS initialized_at TIMESTAMPTZ;

UPDATE public.instantly_bypass_config
SET initialized_at = COALESCE(initialized_at, updated_at, NOW())
WHERE initialized_at IS NULL;

ALTER TABLE public.instantly_bypass_templates
    ADD COLUMN IF NOT EXISTS campaign_id TEXT;

UPDATE public.instantly_bypass_templates AS t
SET campaign_id = c.campaign_id
FROM (
    SELECT campaign_id
    FROM public.instantly_bypass_config
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1
) AS c
WHERE t.campaign_id IS NULL;

UPDATE public.instantly_bypass_templates
SET campaign_id = '2cd03978-93b3-4462-ad88-f0fb0f35d59c'
WHERE campaign_id IS NULL;

ALTER TABLE public.instantly_bypass_templates
    ALTER COLUMN campaign_id SET NOT NULL;

ALTER TABLE public.instantly_bypass_templates
    DROP CONSTRAINT IF EXISTS instantly_bypass_templates_template_key_key;

ALTER TABLE public.instantly_bypass_templates
    DROP CONSTRAINT IF EXISTS instantly_bypass_templates_campaign_key_key;

ALTER TABLE public.instantly_bypass_templates
    ADD CONSTRAINT instantly_bypass_templates_campaign_key_key
    UNIQUE (campaign_id, template_key);

CREATE INDEX IF NOT EXISTS instantly_bypass_templates_campaign_idx
    ON public.instantly_bypass_templates (campaign_id);

COMMENT ON COLUMN public.instantly_bypass_templates.campaign_id IS
  'Instantly campaign UUID this copy belongs to.';
COMMENT ON COLUMN public.instantly_bypass_config.webhook_id IS
  'Instantly lead_interested webhook id registered for this campaign.';
COMMENT ON COLUMN public.instantly_bypass_config.webhook_auto_send_enabled IS
  'Per-campaign pause for webhook auto-send E1. Global instantly_bypass_settings remains an emergency kill-switch.';
COMMENT ON COLUMN public.instantly_bypass_config.initialized_at IS
  'When this campaign was first bootstrapped in the subsequence tool.';
