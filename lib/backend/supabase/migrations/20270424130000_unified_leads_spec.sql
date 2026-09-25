-- Unified outreach leads (phase 2 — table + backfill; legacy niche tables kept until app cutover).
-- Apply after code reads/writes public.leads. Do not drop comptable/cif/comptable_delivery yet.

CREATE TABLE IF NOT EXISTS public.leads (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category                        TEXT NOT NULL CHECK (category IN ('comptable', 'cif', 'comptable_delivery')),
    segment                         TEXT,
    email                           TEXT NOT NULL,
    statut                          public.lead_statut NOT NULL DEFAULT 'NOTBOOKED',
    slug                            TEXT NOT NULL,
    instantly_lead_id               TEXT,
    instantly_campaign_id           TEXT,
    calendly_invitee_uri            TEXT,
    booked_at                       TIMESTAMPTZ,
    instantly_synced_at             TIMESTAMPTZ,
    first_name                      TEXT,
    company                         TEXT,
    calendly_payload                JSONB,
    calendly_questions              JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_at                    TIMESTAMPTZ,
    confirmed_at                    TIMESTAMPTZ,
    instantly_confirmed_synced_at   TIMESTAMPTZ,
    calendly_join_url               TEXT,
    calendly_reschedule_url         TEXT,
    calendly_cancel_url             TEXT,
    calendly_links_synced_at        TIMESTAMPTZ,
    calendly_links_sync_error       TEXT,
    reservation_link                TEXT,
    confirmation_link               TEXT,
    dashboard_link                  TEXT,
    product_statut                  public.product_statut NOT NULL DEFAULT 'NONE',
    onboarding_completed_at         TIMESTAMPTZ,
    retraction_status               TEXT,
    retraction_ends_at              TIMESTAMPTZ,
    retraction_waived_at            TIMESTAMPTZ,
    profile                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_id                       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    legacy_source_table             TEXT,
    legacy_source_id                UUID,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT leads_legacy_source_unique UNIQUE (legacy_source_table, legacy_source_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_email_category_lower_idx
    ON public.leads (category, lower(trim(email)));
CREATE UNIQUE INDEX IF NOT EXISTS leads_slug_idx ON public.leads (slug);
CREATE INDEX IF NOT EXISTS leads_category_statut_idx ON public.leads (category, statut);

COMMENT ON TABLE public.leads IS
  'Unified outreach leads — backfilled from comptable_delivery, comptable, cif. Paying Engin remains on clients.';

-- Backfill comptable_delivery (largest)
INSERT INTO public.leads (
    id, category, segment, email, statut, slug,
    instantly_lead_id, instantly_campaign_id, calendly_invitee_uri,
    booked_at, instantly_synced_at, first_name, company,
    calendly_payload, calendly_questions, scheduled_at, confirmed_at,
    instantly_confirmed_synced_at, calendly_join_url, calendly_reschedule_url,
    calendly_cancel_url, calendly_links_synced_at, calendly_links_sync_error,
    reservation_link, confirmation_link, dashboard_link,
    product_statut, onboarding_completed_at, retraction_status, retraction_ends_at,
    retraction_waived_at, profile, client_id, legacy_source_table, legacy_source_id,
    created_at, updated_at
)
SELECT
    id, 'comptable_delivery', COALESCE(profile->>'segment', profile->>'campaign'),
    email, statut, slug,
    instantly_lead_id, instantly_campaign_id, calendly_invitee_uri,
    booked_at, instantly_synced_at, first_name, company,
    calendly_payload, calendly_questions, scheduled_at, confirmed_at,
    instantly_confirmed_synced_at, calendly_join_url, calendly_reschedule_url,
    calendly_cancel_url, calendly_links_synced_at, calendly_links_sync_error,
    reservation_comptable_delivery_link, confirmation_comptable_delivery_link, dashboard_link,
    product_statut, onboarding_completed_at, retraction_status, retraction_ends_at,
    retraction_waived_at, profile, client_id, 'comptable_delivery', id,
    created_at, updated_at
FROM public.comptable_delivery
ON CONFLICT (legacy_source_table, legacy_source_id) DO NOTHING;

INSERT INTO public.leads (
    id, category, segment, email, statut, slug,
    instantly_lead_id, instantly_campaign_id, calendly_invitee_uri,
    booked_at, instantly_synced_at, first_name, company,
    calendly_payload, calendly_questions, scheduled_at, confirmed_at,
    instantly_confirmed_synced_at, calendly_join_url, calendly_reschedule_url,
    calendly_cancel_url, calendly_links_synced_at, calendly_links_sync_error,
    reservation_link, confirmation_link, dashboard_link,
    product_statut, onboarding_completed_at, profile,
    legacy_source_table, legacy_source_id, created_at, updated_at
)
SELECT
    id, 'comptable', COALESCE(profile->>'segment', profile->>'campaign'),
    email, statut, slug,
    instantly_lead_id, instantly_campaign_id, calendly_invitee_uri,
    booked_at, instantly_synced_at, first_name, company,
    calendly_payload, calendly_questions, scheduled_at, confirmed_at,
    instantly_confirmed_synced_at, calendly_join_url, calendly_reschedule_url,
    calendly_cancel_url, calendly_links_synced_at, calendly_links_sync_error,
    reservation_comptable_link, confirmation_comptable_link, dashboard_link,
    product_statut, onboarding_completed_at, profile,
    'comptable', id, created_at, updated_at
FROM public.comptable
ON CONFLICT (legacy_source_table, legacy_source_id) DO NOTHING;

INSERT INTO public.leads (
    id, category, segment, email, statut, slug,
    instantly_lead_id, instantly_campaign_id, calendly_invitee_uri,
    booked_at, instantly_synced_at, first_name, company,
    calendly_payload, calendly_questions, scheduled_at, confirmed_at,
    instantly_confirmed_synced_at, calendly_join_url, calendly_reschedule_url,
    calendly_cancel_url, calendly_links_synced_at, calendly_links_sync_error,
    reservation_link, confirmation_link, dashboard_link,
    product_statut, onboarding_completed_at, retraction_status, retraction_ends_at,
    retraction_waived_at, profile, legacy_source_table, legacy_source_id,
    created_at, updated_at
)
SELECT
    id, 'cif', COALESCE(profile->>'segment', profile->>'campaign'),
    email, statut, slug,
    instantly_lead_id, instantly_campaign_id, calendly_invitee_uri,
    booked_at, instantly_synced_at, first_name, company,
    calendly_payload, calendly_questions, scheduled_at, confirmed_at,
    instantly_confirmed_synced_at, calendly_join_url, calendly_reschedule_url,
    calendly_cancel_url, calendly_links_synced_at, calendly_links_sync_error,
    reservation_cif_link, reservation_cif_link, dashboard_link,
    product_statut, onboarding_completed_at, retraction_status, retraction_ends_at,
    retraction_waived_at, profile, 'cif', id, created_at, updated_at
FROM public.cif
ON CONFLICT (legacy_source_table, legacy_source_id) DO NOTHING;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
