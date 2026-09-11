-- Link CIF Instantly list to niche outreach config (scraper intake list).

ALTER TABLE public.niche_outreach_config
  ADD COLUMN IF NOT EXISTS instantly_list_id uuid;

COMMENT ON COLUMN public.niche_outreach_config.instantly_list_id IS
  'Instantly lead list UUID paired with instantly_campaign_id for this niche.';

UPDATE public.niche_outreach_config
SET instantly_list_id = '4a616678-06a0-44d2-a27c-f9248a4c34bf'::uuid,
    updated_at = now()
WHERE niche = 'cif'
  AND instantly_campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'::uuid;
