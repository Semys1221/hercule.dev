-- Link tracking: agence / entreprise lead tables (standalone from public.leads CRM)

CREATE TYPE public.lead_statut AS ENUM ('NOTBOOKED', 'BOOKED');

CREATE TABLE public.agence (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 TEXT NOT NULL,
    statut                public.lead_statut NOT NULL DEFAULT 'NOTBOOKED',
    link                  TEXT NOT NULL,
    instantly_lead_id     TEXT,
    instantly_campaign_id TEXT,
    calendly_invitee_uri  TEXT,
    booked_at             TIMESTAMPTZ,
    instantly_synced_at   TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.entreprise (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 TEXT NOT NULL,
    statut                public.lead_statut NOT NULL DEFAULT 'NOTBOOKED',
    link                  TEXT NOT NULL,
    instantly_lead_id     TEXT,
    instantly_campaign_id TEXT,
    calendly_invitee_uri  TEXT,
    booked_at             TIMESTAMPTZ,
    instantly_synced_at   TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.agence IS
  'Link tracking leads — agence category. statut NOTBOOKED until Calendly booking.';
COMMENT ON TABLE public.entreprise IS
  'Link tracking leads — entreprise category. statut NOTBOOKED until Calendly booking.';
COMMENT ON COLUMN public.agence.link IS 'Unique URL slug passed as Calendly utm_content.';
COMMENT ON COLUMN public.entreprise.link IS 'Unique URL slug passed as Calendly utm_content.';

CREATE UNIQUE INDEX agence_email_lower_idx ON public.agence (lower(trim(email)));
CREATE UNIQUE INDEX agence_link_idx ON public.agence (link);
CREATE UNIQUE INDEX entreprise_email_lower_idx ON public.entreprise (lower(trim(email)));
CREATE UNIQUE INDEX entreprise_link_idx ON public.entreprise (link);

CREATE INDEX agence_statut_idx ON public.agence (statut);
CREATE INDEX entreprise_statut_idx ON public.entreprise (statut);

CREATE OR REPLACE FUNCTION public.set_link_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agence_updated_at
    BEFORE UPDATE ON public.agence
    FOR EACH ROW
    EXECUTE FUNCTION public.set_link_tracking_updated_at();

CREATE TRIGGER entreprise_updated_at
    BEFORE UPDATE ON public.entreprise
    FOR EACH ROW
    EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.agence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprise ENABLE ROW LEVEL SECURITY;
