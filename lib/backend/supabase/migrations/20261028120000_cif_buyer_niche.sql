-- CIF buyer niche: lead table, demandes carousel, FKs, outreach seed, E1–E3 templates.

ALTER TABLE public.niche_outreach_config
    DROP CONSTRAINT IF EXISTS niche_outreach_config_niche_check;
ALTER TABLE public.niche_outreach_config
    ADD CONSTRAINT niche_outreach_config_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif'));

ALTER TABLE public.email_variable_bindings
    DROP CONSTRAINT IF EXISTS email_variable_bindings_niche_check;
ALTER TABLE public.email_variable_bindings
    ADD CONSTRAINT email_variable_bindings_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif'));

CREATE TABLE public.cif (
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
    calendly_join_url                TEXT,
    calendly_reschedule_url         TEXT,
    calendly_cancel_url             TEXT,
    calendly_links_synced_at        TIMESTAMPTZ,
    calendly_links_sync_error       TEXT,
    reservation_cif_link            TEXT NOT NULL,
    confirmation_cif_link           TEXT NOT NULL,
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

COMMENT ON TABLE public.cif IS
  'Link tracking leads — cabinet CIF / CGP buyer niche.';

CREATE UNIQUE INDEX cif_email_lower_idx ON public.cif (lower(trim(email)));
CREATE UNIQUE INDEX cif_slug_idx ON public.cif (slug);
CREATE INDEX cif_statut_idx ON public.cif (statut);

CREATE TRIGGER cif_set_updated_at
    BEFORE UPDATE ON public.cif
    FOR EACH ROW EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.cif ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sales_calls
    ADD COLUMN IF NOT EXISTS cif_id UUID REFERENCES public.cif(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_calls_cif_id_idx ON public.sales_calls (cif_id);

ALTER TABLE public.sales_calls
    DROP CONSTRAINT IF EXISTS sales_calls_owner_check;

ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int = 1
    );

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS cif_id UUID REFERENCES public.cif(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payments_cif_id_idx ON public.payments (cif_id);

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_owner_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int = 1
    );

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_lead_category_check;
ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_lead_category_check
    CHECK (lead_category IN ('agence', 'comptable', 'entreprise', 'cif'));

ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_category_check;
ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_category_check
    CHECK (category IN ('agence', 'comptable', 'entreprise', 'cif'));

CREATE TABLE public.cif_demandes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id     TEXT NOT NULL UNIQUE,
    record_type     TEXT NOT NULL CHECK (record_type IN ('demande', 'teaser')),
    niche           TEXT NOT NULL,
    secteur         TEXT NOT NULL,
    prestation      TEXT,
    budget          TEXT,
    taille          TEXT,
    zone            TEXT,
    disponibilite   TEXT,
    origine         TEXT,
    duree_souhaitee TEXT,
    horizon_resultat TEXT,
    historique_agences TEXT,
    status          TEXT CHECK (status IS NULL OR status IN ('available', 'assigned')),
    available_from  DATE,
    available_until DATE,
    titre           TEXT,
    description     TEXT,
    note            TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cif_demandes_demande_fields CHECK (
        record_type = 'teaser'
        OR (
            prestation IS NOT NULL
            AND budget IS NOT NULL
            AND taille IS NOT NULL
            AND zone IS NOT NULL
            AND disponibilite IS NOT NULL
            AND status IS NOT NULL
            AND available_from IS NOT NULL
            AND available_until IS NOT NULL
            AND origine IS NOT NULL
            AND duree_souhaitee IS NOT NULL
            AND horizon_resultat IS NOT NULL
            AND historique_agences IS NOT NULL
        )
    ),
    CONSTRAINT cif_demandes_teaser_fields CHECK (
        record_type = 'demande'
        OR (
            titre IS NOT NULL
            AND description IS NOT NULL
            AND note IS NOT NULL
        )
    )
);

CREATE INDEX cif_demandes_record_type_status_sort_idx
    ON public.cif_demandes (record_type, status, sort_order);

CREATE TRIGGER cif_demandes_updated_at
    BEFORE UPDATE ON public.cif_demandes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.cif_demandes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.cif_demandes (
    external_id, record_type, niche, secteur,
    prestation, budget, taille, zone, disponibilite, origine,
    duree_souhaitee, horizon_resultat, historique_agences,
    status, available_from, available_until, sort_order
) VALUES
    ('C1', 'demande', 'btp', 'BTP / rénovation',
     'Optimisation fiscale + trésorerie', '3 600–4 800 €/an', '4 salariés', 'Île-de-France', 'Septembre',
     'Recherche de conseiller', 'Mission annuelle', 'Premier RDV sous 15 jours', 'Banque privée précédente',
     'available', '2026-09-08', '2026-11-30', 1),
    ('C2', 'demande', 'restauration', 'Restauration',
     'PER dirigeant + cash-flow', '2 400–3 600 €/an', '2 salariés', 'PACA', 'Septembre',
     'Création d''activité', 'Mission annuelle', 'Mise en place sous 30 jours', 'Premier cabinet',
     'assigned', '2026-09-08', '2026-11-30', 2);

INSERT INTO public.cif_demandes (
    external_id, record_type, niche, secteur, titre, description, note, sort_order
) VALUES (
    'CT1', 'teaser', 'a-venir', 'Conseil financier',
    'Nouvelles demandes CIF',
    'Dirigeants PME en optimisation fiscale et trésorerie — attribution en cours.',
    'Missions qualifiées Hercule CIF',
    99
);

INSERT INTO public.email_variable_bindings (niche, variable_key, enabled)
VALUES
  ('cif', 'firstNameLine', true),
  ('cif', 'date', true),
  ('cif', 'heure', true),
  ('cif', 'confirmation_cif_link', true),
  ('cif', 'confirmLink', true),
  ('cif', 'reservation_cif_link', true),
  ('cif', 'dashboardLink', true),
  ('cif', 'email', true),
  ('cif', 'company', true)
ON CONFLICT (niche, variable_key) DO NOTHING;

INSERT INTO public.niche_outreach_config (niche, instantly_campaign_id, calendly_event_type_uri)
VALUES (
  'cif',
  'e3bdb573-fe9f-437d-bd96-4ceb52869dd4',
  'https://api.calendly.com/event_types/6d51da2b-5d25-40f4-ba29-e43e268c0cc0'
)
ON CONFLICT (niche) DO UPDATE SET
  instantly_campaign_id = EXCLUDED.instantly_campaign_id,
  calendly_event_type_uri = EXCLUDED.calendly_event_type_uri,
  updated_at = now();

INSERT INTO public.instantly_bypass_config (
    campaign_id,
    campaign_name,
    interested_subsequence_id,
    initialized_at
)
VALUES (
    'e3bdb573-fe9f-437d-bd96-4ceb52869dd4',
    'Conseil Financier',
    'd656122e-fb42-42ac-a8c9-324eb9a13b86',
    NOW()
)
ON CONFLICT (campaign_id) DO UPDATE SET
    campaign_name = EXCLUDED.campaign_name,
    interested_subsequence_id = EXCLUDED.interested_subsequence_id,
    updated_at = NOW();

INSERT INTO public.instantly_bypass_templates (campaign_id, template_key, subject, body_html)
VALUES
    (
        'e3bdb573-fe9f-437d-bd96-4ceb52869dd4',
        'interested_email1',
        'Re: votre message',
        'Voici plus de précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué d''indépendants et dirigeants de PME/TPE en recherche d''un accompagnement d''optimisation fiscale et de trésorerie dans votre secteur.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter au minimum 2 associés ou collaborateurs.<br/><br/>{{accountSignature}}'
    ),
    (
        'e3bdb573-fe9f-437d-bd96-4ceb52869dd4',
        'interested_email2',
        'Re: votre message',
        'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}'
    ),
    (
        'e3bdb573-fe9f-437d-bd96-4ceb52869dd4',
        'interested_email3',
        'Re: votre message',
        'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l''avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}'
    )
ON CONFLICT (campaign_id, template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    updated_at = NOW();

INSERT INTO public.ai_reply_agent_config (
    campaign_id,
    campaign_name,
    niche_preset_id,
    niche_metadata,
    target_type,
    prompt_key,
    prompt_snapshot,
    status
)
VALUES (
    'e3bdb573-fe9f-437d-bd96-4ceb52869dd4',
    'Conseil Financier',
    'conseillers_gestion_patrimoine',
    '{"angle": "Lead gen pour cabinets CGP et courtiers", "valeur_client": "Prise de RDV avec des cabinets patrimoine / assurance", "effectif_cible": "3+ salariés"}'::jsonb,
    'buyer',
    'conseillers_gestion_patrimoine_buyer',
    $prompt$# conseillers_gestion_patrimoine — Buyer (cabinet CIF)

Tu écris à un **cabinet CIF / CGP** (France) qui a marqué son intérêt pour recevoir des demandes via Hercule.

- Parle comme Béatrice Meyer.
- **Contexte** : Hercule reçoit des demandes d'indépendants et de dirigeants de PME/TPE en recherche d'un accompagnement d'optimisation fiscale et de trésorerie. Ces demandes sont transmises aux cabinets partenaires.
- **Éligibilité / bande passante** : le seuil « minimum 2 associés ou collaborateurs » est un **indicateur de capacité**, pas un refus automatique.
- **CTA** : inviter à postuler via {reservation_cif_link} (« Proposer mon cabinet ») si le prospect veut recevoir ces demandes.
- **Relance (E2)** : rappel de la fenêtre 19 sept.–02 oct. ; demandes de contrat annuel en attente.
- **Clôture (E3)** : sans retour, clôture polie ; la porte reste ouverte.
- **Ne parle pas d'argent** sauf demande explicite ; renvoie vers hercule.dev/cvg/conseil-financier **sans chiffrer**.
- Si la réponse n'est pas dans le knowledge pack, **n'envoie pas** (should_reply=false).
$prompt$,
    'not_initialized'
)
ON CONFLICT (campaign_id) DO UPDATE SET
    niche_preset_id = EXCLUDED.niche_preset_id,
    prompt_key = EXCLUDED.prompt_key,
    prompt_snapshot = EXCLUDED.prompt_snapshot,
    updated_at = NOW();
