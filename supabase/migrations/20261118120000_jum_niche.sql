-- JUM Advisory niche: lead table, outreach config, E1–E3 templates, reply agent seed.

ALTER TABLE public.niche_outreach_config
    DROP CONSTRAINT IF EXISTS niche_outreach_config_niche_check;
ALTER TABLE public.niche_outreach_config
    ADD CONSTRAINT niche_outreach_config_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif', 'jum'));

ALTER TABLE public.email_variable_bindings
    DROP CONSTRAINT IF EXISTS email_variable_bindings_niche_check;
ALTER TABLE public.email_variable_bindings
    ADD CONSTRAINT email_variable_bindings_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif', 'jum'));

CREATE TABLE public.jum (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    reservation_jum_link            TEXT NOT NULL,
    confirmation_jum_link           TEXT NOT NULL,
    dashboard_link                  TEXT,
    product_statut                  public.product_statut NOT NULL DEFAULT 'NONE',
    onboarding_completed_at         TIMESTAMPTZ,
    retraction_status               TEXT,
    retraction_ends_at              TIMESTAMPTZ,
    retraction_waived_at            TIMESTAMPTZ,
    profile                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.jum IS
  'Link tracking leads — JUM Advisory outreach niche (Béatrice Meyer / secrétaire comptable).';

CREATE UNIQUE INDEX jum_email_lower_idx ON public.jum (lower(trim(email)));
CREATE UNIQUE INDEX jum_slug_idx ON public.jum (slug);
CREATE INDEX jum_statut_idx ON public.jum (statut);

CREATE TRIGGER jum_set_updated_at
    BEFORE UPDATE ON public.jum
    FOR EACH ROW EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.jum ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sales_calls
    ADD COLUMN IF NOT EXISTS jum_id UUID REFERENCES public.jum(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_calls_jum_id_idx ON public.sales_calls (jum_id);

ALTER TABLE public.sales_calls
    DROP CONSTRAINT IF EXISTS sales_calls_owner_check;

ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (jum_id IS NOT NULL)::int = 1
    );

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS jum_id UUID REFERENCES public.jum(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payments_jum_id_idx ON public.payments (jum_id);

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_owner_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (jum_id IS NOT NULL)::int = 1
    );

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_lead_category_check;
ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_lead_category_check
    CHECK (lead_category IN ('agence', 'comptable', 'entreprise', 'cif', 'jum'));

ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_category_check;
ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_category_check
    CHECK (category IN ('agence', 'comptable', 'entreprise', 'cif', 'jum'));

INSERT INTO public.email_variable_bindings (niche, variable_key, enabled)
VALUES
  ('jum', 'firstNameLine', true),
  ('jum', 'date', true),
  ('jum', 'heure', true),
  ('jum', 'confirmation_jum_link', true),
  ('jum', 'confirmLink', true),
  ('jum', 'reservation_jum_link', true),
  ('jum', 'dashboardLink', true),
  ('jum', 'email', true),
  ('jum', 'company', true)
ON CONFLICT (niche, variable_key) DO NOTHING;

-- Campaign/list IDs configured via admin or env after Instantly bootstrap.
INSERT INTO public.niche_outreach_config (niche, instantly_campaign_id, calendly_event_type_uri)
VALUES (
  'jum',
  '00000000-0000-0000-0000-000000000000',
  'https://api.calendly.com/event_types/6d51da2b-5d25-40f4-ba29-e43e268c0cc0'
)
ON CONFLICT (niche) DO UPDATE SET
  calendly_event_type_uri = EXCLUDED.calendly_event_type_uri,
  updated_at = now();

INSERT INTO public.instantly_bypass_templates (campaign_id, template_key, subject, body_html)
SELECT
    noc.instantly_campaign_id,
    t.template_key,
    t.subject,
    t.body_html
FROM public.niche_outreach_config noc
CROSS JOIN (
    VALUES
        (
            'interested_email1_restaurant',
            'Re: votre message',
            '<p>Bonjour,<br/><br/>Les restaurants que nous accompagnons ont souvent le problème suivant : ils font du chiffre, travaillent énormément, mais ne comprennent pas pourquoi il leur reste finalement si peu à la fin du mois.<br/><br/>Il existe des leviers permettant d''augmenter le bénéfice sans devoir travailler davantage.<br/><br/>Nous pouvons identifier rapidement lesquels sont applicables à votre restaurant.<br/><br/><strong>Cliquez ici pour résoudre ce problème rapidement :</strong> <a href="{{reservation_jum_link}}">Réserver un créneau</a><br/><br/>{{accountSignature}}</p>'
        ),
        (
            'interested_email1_b2b',
            'Re: votre message',
            '<p>Bonjour,<br/><br/>Les dirigeants que nous accompagnons ont souvent le problème suivant : ils doivent avancer les salaires et les fournisseurs pendant plusieurs semaines avant que leurs clients ne les paient.<br/><br/>Il existe des leviers légaux permettant de réduire ce décalage sans forcément faire pression sur leurs clients.<br/><br/>Nous pouvons identifier rapidement lesquels sont applicables à votre entreprise.<br/><br/><strong>Cliquez ici pour résoudre ce problème rapidement :</strong> <a href="{{reservation_jum_link}}">Réserver un créneau</a><br/><br/>{{accountSignature}}</p>'
        ),
        (
            'interested_email1_dentiste',
            'Re: votre message',
            '<p>Bonjour,<br/><br/>Les chirurgiens-dentistes que nous accompagnons ont souvent le problème suivant : leur agenda est rempli, leurs honoraires sont élevés, mais ils ne savent pas précisément pourquoi il leur reste si peu à la fin du mois.<br/><br/>Il existe des leviers permettant d''augmenter le bénéfice réellement conservé par le cabinet.<br/><br/>Nous pouvons identifier rapidement lesquels sont applicables à votre cabinet.<br/><br/><strong>Cliquez ici pour résoudre ce problème rapidement :</strong> <a href="{{reservation_jum_link}}">Réserver un créneau</a><br/><br/>{{accountSignature}}</p>'
        ),
        (
            'interested_email1',
            'Re: votre message',
            '<p>Bonjour,<br/><br/>Les dirigeants que nous accompagnons ont souvent le problème suivant : ils doivent avancer les salaires et les fournisseurs pendant plusieurs semaines avant que leurs clients ne les paient.<br/><br/>Il existe des leviers légaux permettant de réduire ce décalage.<br/><br/><strong>Cliquez ici pour résoudre ce problème rapidement :</strong> <a href="{{reservation_jum_link}}">Réserver un créneau</a><br/><br/>{{accountSignature}}</p>'
        ),
        (
            'interested_email2',
            'Re: votre message',
            '<p>Bonjour,<br/><br/>Je reviens vers vous suite à mon précédent message — avez-vous eu l''occasion d''y jeter un œil ?<br/><br/>Si le sujet vous parle, vous pouvez réserver un créneau ici : <a href="{{reservation_jum_link}}">Réserver un créneau</a><br/><br/>{{accountSignature}}</p>'
        ),
        (
            'interested_email3',
            'Re: votre message',
            '<p>Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je clôture nos échanges ici.<br/><br/>Si le sujet devient pertinent pour vous à l''avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}</p>'
        )
) AS t(template_key, subject, body_html)
WHERE noc.niche = 'jum'
  AND noc.instantly_campaign_id IS NOT NULL
  AND noc.instantly_campaign_id <> ''
ON CONFLICT (campaign_id, template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    updated_at = NOW();
