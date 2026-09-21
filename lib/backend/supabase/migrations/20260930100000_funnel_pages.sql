-- funnel_pages table — CMS pour le builder funnels (FUN-01)
-- Migre les JSON statiques de content/funnels/**/* vers la DB.

CREATE TABLE IF NOT EXISTS public.funnel_pages (
    slug          TEXT PRIMARY KEY,
    audience      TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published')),
    tree          JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.funnel_pages IS
    'Pages funnel stockées en DB. Lues par /internal/funnels et servies par /api/funnels/[slug].';

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_funnel_pages_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS funnel_pages_updated_at ON public.funnel_pages;
CREATE TRIGGER funnel_pages_updated_at
    BEFORE UPDATE ON public.funnel_pages
    FOR EACH ROW EXECUTE PROCEDURE public.set_funnel_pages_updated_at();
