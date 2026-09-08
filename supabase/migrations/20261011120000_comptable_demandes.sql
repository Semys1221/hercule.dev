-- Comptable marketing: missions TPE carousel (frontend source of truth)

CREATE TABLE public.comptable_demandes (
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
    CONSTRAINT comptable_demandes_demande_fields CHECK (
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
    CONSTRAINT comptable_demandes_teaser_fields CHECK (
        record_type = 'demande'
        OR (
            titre IS NOT NULL
            AND description IS NOT NULL
            AND note IS NOT NULL
        )
    )
);

COMMENT ON TABLE public.comptable_demandes IS
  'Marketing missions TPE shown on the comptable homepage carousel.';

CREATE INDEX comptable_demandes_record_type_status_sort_idx
    ON public.comptable_demandes (record_type, status, sort_order);

CREATE TRIGGER comptable_demandes_updated_at
    BEFORE UPDATE ON public.comptable_demandes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.comptable_demandes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.comptable_demandes (
    external_id, record_type, niche, secteur,
    prestation, budget, taille, zone, disponibilite, origine,
    duree_souhaitee, horizon_resultat, historique_agences,
    status, available_from, available_until, sort_order
) VALUES
    ('T1', 'demande', 'btp', 'BTP / rénovation',
     'Reprise tenue + liasse fiscale', '3 600–4 800 €/an', '4 salariés', 'Île-de-France', 'Septembre',
     'Changement expert-comptable', 'Mission annuelle', 'Premier RDV sous 15 jours', 'Cabinet précédent — délais de clôture',
     'available', '2026-09-08', '2026-11-30', 1),
    ('T2', 'demande', 'restauration', 'Restauration',
     'Création SASU + TVA + paie', '2 400–3 600 €/an', '2 salariés', 'PACA', 'Septembre',
     'Création d''activité', 'Mission annuelle', 'Immatriculation sous 30 jours', 'Premier cabinet',
     'assigned', '2026-09-08', '2026-11-30', 2),
    ('T3', 'demande', 'commerce', 'E-commerce',
     'Reprise comptabilité + déclarations TVA', '3 000–4 200 €/an', 'Auto-entrepreneur', 'Occitanie', 'Septembre',
     'Croissance CA', 'Mission annuelle', 'Reprise avant clôture fiscale', 'Comptabilité gérée seul jusqu''ici',
     'available', '2026-09-08', '2026-11-30', 3),
    ('T4', 'demande', 'services', 'Services B2B',
     'Tenue + obligations sociales', '4 200–5 400 €/an', '6 salariés', 'Auvergne-Rhône-Alpes', 'Octobre',
     'Recrutement salariés', 'Mission annuelle', 'Paie opérationnelle sous 45 jours', 'Expert-comptable en ligne insatisfaisant',
     'available', '2026-09-08', '2026-11-30', 4),
    ('T5', 'demande', 'artisan', 'Artisanat',
     'Reprise dossier + liasse IS', '2 800–3 600 €/an', '3 salariés', 'Grand Est', 'Octobre',
     'Passage micro → réel', 'Mission annuelle', 'Basculer avant échéance TVA', 'Premier cabinet structuré',
     'available', '2026-09-08', '2026-11-30', 5),
    ('T6', 'demande', 'freelance', 'Conseil',
     'Création EURL + tenue', '2 400–3 000 €/an', 'Dirigeant seul', 'Bretagne', 'Octobre',
     'Lancement activité conseil', 'Mission annuelle', 'Premier bilan sous 90 jours', 'Premier cabinet',
     'assigned', '2026-09-08', '2026-11-30', 6),
    ('T7', 'demande', 'commerce', 'Commerce',
     'Reprise tenue + paie boutique', '3 600–4 800 €/an', '5 salariés', 'Nouvelle-Aquitaine', 'Octobre',
     'Ouverture second point de vente', 'Mission annuelle', 'Paie stabilisée sous 30 jours', 'Cabinet local — manque de réactivité',
     'available', '2026-09-08', '2026-11-30', 7),
    ('T8', 'demande', 'services', 'Immobilier',
     'Tenue + TVA + liasse', '4 800–6 000 €/an', '8 salariés', 'Île-de-France', 'Novembre',
     'Reprise après fusion', 'Mission annuelle', 'Consolidation sous 60 jours', '2 cabinets testés — insatisfait du suivi',
     'available', '2026-09-08', '2026-11-30', 8),
    ('T9', 'demande', 'restauration', 'Restauration',
     'Reprise compta + paie saisonniers', '3 000–4 200 €/an', '12 salariés', 'Normandie', 'Novembre',
     'Saison estivale', 'Mission annuelle', 'Paie prête avant haute saison', 'Gestion interne jusqu''ici',
     'available', '2026-09-08', '2026-11-30', 9),
    ('T10', 'demande', 'btp', 'BTP / rénovation',
     'Tenue + déclarations URSSAF', '3 600–5 400 €/an', '7 salariés', 'Hauts-de-France', 'Novembre',
     'Contrôle URSSAF récent', 'Mission annuelle', 'Mise en conformité sous 45 jours', 'Cabinet précédent — erreurs paie',
     'available', '2026-09-08', '2026-11-30', 10),
    ('T11', 'demande', 'artisan', 'Artisanat',
     'Reprise dossier + TVA trimestrielle', '2 400–3 600 €/an', '1 salarié', 'Centre-Val de Loire', 'Novembre',
     'Dépassement seuil micro', 'Mission annuelle', 'TVA en place avant T4', 'Premier cabinet',
     'assigned', '2026-09-08', '2026-11-30', 11),
    ('T12', 'demande', 'freelance', 'Formation',
     'Création + tenue micro → réel', '2 000–3 000 €/an', 'Dirigeant seul', 'Pays de la Loire', 'Décembre',
     'Croissance activité formation', 'Mission annuelle', 'Basculer avant clôture', 'Comptabilité autonome',
     'available', '2026-09-08', '2026-11-30', 12),
    ('T13', 'demande', 'commerce', 'E-commerce',
     'Tenue + TVA OSS + paie', '4 200–5 400 €/an', '4 salariés', 'France', 'Décembre',
     'Expansion e-commerce UE', 'Mission annuelle', 'TVA OSS opérationnelle sous 30 jours', 'Cabinet généraliste — manque e-commerce',
     'available', '2026-09-08', '2026-11-30', 13),
    ('T14', 'demande', 'services', 'Ressources humaines',
     'Reprise tenue + paie cabinet', '5 400–7 200 €/an', '15 salariés', 'Île-de-France', 'Décembre',
     'Externalisation paie', 'Mission annuelle', 'Paie externalisée sous 30 jours', 'Paie gérée en interne',
     'available', '2026-09-08', '2026-11-30', 14),
    ('T15', 'demande', 'artisan', 'Artisanat',
     'Mission création + première liasse', '2 400–3 000 €/an', 'Dirigeant seul', 'Corse', 'Janvier',
     'Création artisan', 'Mission annuelle', 'Immatriculation sous 21 jours', 'Premier cabinet',
     'available', '2026-09-08', '2026-11-30', 15),
    ('T16', 'demande', 'btp', 'BTP / rénovation',
     'Tenue + liasse + paie chantier', '4 800–6 000 €/an', '10 salariés', 'Occitanie', 'Janvier',
     'Marchés publics remportés', 'Mission annuelle', 'Paie chantier sous 45 jours', 'Cabinet précédent — retards récurrents',
     'available', '2026-09-08', '2026-11-30', 16);

INSERT INTO public.comptable_demandes (
    external_id, record_type, niche, secteur,
    titre, description, note, sort_order
) VALUES (
    'AVENIR-SANTE-TPE', 'teaser', 'a-venir', 'Santé libérale',
    'Professions libérales médicales',
    'Médecins, kinésithérapeutes et professions libérales en création ou reprise.',
    'Les prochaines missions seront ajoutées au fur et à mesure de leur qualification.',
    17
);
