-- Temporary generated alias so undeployed Next.js (eq("link")) keeps working.
-- Drop after the new slug-based app is in production.

ALTER TABLE public.agence
    ADD COLUMN IF NOT EXISTS link TEXT GENERATED ALWAYS AS (slug) STORED;
ALTER TABLE public.entreprise
    ADD COLUMN IF NOT EXISTS link TEXT GENERATED ALWAYS AS (slug) STORED;

COMMENT ON COLUMN public.agence.link IS
  'Generated alias of slug for backward-compatible lookups. Prefer slug.';
COMMENT ON COLUMN public.entreprise.link IS
  'Generated alias of slug for backward-compatible lookups. Prefer slug.';
