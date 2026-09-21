-- Agence marketing: demandes carousel (frontend source of truth)

CREATE TABLE public.agence_demandes (
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
    status          TEXT CHECK (status IS NULL OR status IN ('available', 'assigned')),
    available_from  DATE,
    available_until DATE,
    titre           TEXT,
    description     TEXT,
    note            TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT agence_demandes_demande_fields CHECK (
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
        )
    ),
    CONSTRAINT agence_demandes_teaser_fields CHECK (
        record_type = 'demande'
        OR (
            titre IS NOT NULL
            AND description IS NOT NULL
            AND note IS NOT NULL
        )
    )
);

COMMENT ON TABLE public.agence_demandes IS
  'Marketing demandes shown on the agence homepage carousel. Edited via streamlit_demands.';

CREATE INDEX agence_demandes_record_type_status_sort_idx
    ON public.agence_demandes (record_type, status, sort_order);

CREATE TRIGGER agence_demandes_updated_at
    BEFORE UPDATE ON public.agence_demandes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.agence_demandes ENABLE ROW LEVEL SECURITY;

-- Seed: 16 demandes + 1 teaser (order matches lib/demandes-data.ts)

INSERT INTO public.agence_demandes (
    external_id, record_type, niche, secteur,
    prestation, budget, taille, zone, disponibilite,
    status, available_from, available_until, sort_order
) VALUES
    ('C1', 'demande', 'comptabilite', 'Comptabilité',
     'Acquisition SEO + optimisation du site', '1 500–2 500 €/mois', '8 mandataires', 'Grand Est', 'Septembre',
     'available', '2026-09-08', '2026-09-27', 1),
    ('C2', 'demande', 'comptabilite', 'Comptabilité',
     'Refonte site vitrine + acquisition', '4 000–7 000 €', '24 collaborateurs', 'PACA', 'Septembre',
     'assigned', '2026-09-08', '2026-09-27', 2),
    ('C3', 'demande', 'comptabilite', 'Comptabilité',
     'SEO local + création de contenus', '1 500–2 500 €/mois', '11 mandataires', 'Occitanie', 'Septembre',
     'available', '2026-09-08', '2026-09-27', 3),
    ('C4', 'demande', 'comptabilite', 'Comptabilité',
     'Acquisition SEO + SEA', '2 000–3 500 €/mois', '37 collaborateurs', 'Île-de-France', 'Septembre',
     'available', '2026-09-08', '2026-09-27', 4),
    ('F1', 'demande', 'conseil-financier', 'Conseil financier',
     'Refonte site + positionnement digital', '5 000–8 000 €', '6 conseillers', 'Île-de-France', 'Septembre',
     'assigned', '2026-09-16', '2026-11-05', 5),
    ('F2', 'demande', 'conseil-financier', 'Conseil financier',
     'SEO + contenu B2B', '1 800–3 000 €/mois', '18 collaborateurs', 'France', 'Octobre',
     'available', '2026-09-16', '2026-11-05', 6),
    ('F3', 'demande', 'conseil-financier', 'Conseil financier',
     'Acquisition payante + landing pages', '2 000–3 500 €/mois', '9 conseillers', 'Auvergne-Rhône-Alpes', 'Octobre',
     'available', '2026-09-16', '2026-11-05', 7),
    ('F4', 'demande', 'conseil-financier', 'Conseil financier',
     'Site institutionnel + prise de rendez-vous', '3 500–6 000 €', '14 collaborateurs', 'Occitanie', 'Octobre',
     'available', '2026-09-16', '2026-11-05', 8),
    ('F5', 'demande', 'conseil-financier', 'Conseil financier',
     'Acquisition digitale complète', '2 500–4 000 €/mois', '31 collaborateurs', 'France', 'Novembre',
     'available', '2026-09-16', '2026-11-05', 9),
    ('R1', 'demande', 'renovation', 'Solaire',
     'Site + génération de demandes de devis', '4 000–7 000 €', '18 salariés', 'Nouvelle-Aquitaine', 'Octobre–Novembre',
     'available', '2026-10-25', '2026-11-19', 10),
    ('R2', 'demande', 'renovation', 'Pompe à chaleur',
     'Landing pages + acquisition payante', '1 800–3 000 €/mois', '12 salariés', 'France', 'Octobre–Novembre',
     'available', '2026-10-25', '2026-11-19', 11),
    ('R3', 'demande', 'renovation', 'Piscines',
     'Refonte site + génération de leads', '4 000–7 000 €', '9 salariés', 'PACA', 'Octobre–Novembre',
     'assigned', '2026-10-25', '2026-11-19', 12),
    ('R4', 'demande', 'renovation', 'Rénovation énergétique',
     'SEO + acquisition locale', '1 500–2 500 €/mois', '42 salariés', 'France', 'Octobre–Novembre',
     'available', '2026-10-25', '2026-11-19', 13),
    ('G1', 'demande', 'grossiste', 'Grossiste emballage',
     'Refonte e-commerce B2B', '8 000–15 000 €', '27 salariés', 'France', 'Octobre–Novembre',
     'available', '2026-10-25', '2026-11-19', 14),
    ('G2', 'demande', 'grossiste', 'Fournitures médicales',
     'Site B2B + espace professionnel', '7 000–12 000 €', '53 salariés', 'France', 'Octobre–Novembre',
     'available', '2026-10-25', '2026-11-19', 15),
    ('G3', 'demande', 'grossiste', 'Distribution professionnelle',
     'Acquisition B2B + refonte site', '3 000–5 000 €/mois', '16 salariés', 'Europe', 'Octobre–Novembre',
     'available', '2026-10-25', '2026-11-19', 16);

INSERT INTO public.agence_demandes (
    external_id, record_type, niche, secteur,
    titre, description, note, sort_order
) VALUES (
    'AVENIR-SANTE', 'teaser', 'a-venir', 'Santé esthétique',
    'Santé esthétique',
    'Cliniques esthétiques, centres laser et médecine esthétique.',
    'Les prochaines demandes seront ajoutées au fur et à mesure de leur qualification.',
    17
);
