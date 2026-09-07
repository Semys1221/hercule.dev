-- Agence demandes: verso qualification fields (durée, horizon, historique)

ALTER TABLE public.agence_demandes
    ADD COLUMN duree_souhaitee    TEXT,
    ADD COLUMN horizon_resultat   TEXT,
    ADD COLUMN historique_agences TEXT;

-- Comptabilité (C1–C8)
UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Premiers leads qualifiés sous 90 jours',
    historique_agences = 'Première collaboration avec une agence web'
WHERE external_id IN ('C1', 'C3', 'C5', 'C7');

UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (8–10 semaines)',
    horizon_resultat = 'Site livré et indexé sous 60 jours',
    historique_agences = 'Refonte précédente il y a 4 ans — insatisfait du SEO'
WHERE external_id IN ('C2', 'C8');

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Trafic organique en hausse dès le 3e mois',
    historique_agences = '2 agences testées — résultats acquisition insuffisants'
WHERE external_id = 'C4';

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Premiers mandats générés sous 60 jours',
    historique_agences = 'Agence locale précédente — délais non respectés'
WHERE external_id = 'C6';

-- Conseil financier (F1–F10)
UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (10–12 semaines)',
    horizon_resultat = 'Nouveau positionnement visible sous 45 jours',
    historique_agences = 'Refonte institutionnelle datée — besoin de modernisation'
WHERE external_id IN ('F1', 'F4', 'F10');

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Leads B2B qualifiés dès le 2e mois',
    historique_agences = 'Première collaboration avec une agence web'
WHERE external_id IN ('F2', 'F3', 'F6', 'F7');

UPDATE public.agence_demandes SET
    duree_souhaitee = '12 mois minimum',
    horizon_resultat = 'Pipeline commercial stabilisé sous 6 mois',
    historique_agences = 'Agence précédente — insatisfait du reporting'
WHERE external_id = 'F5';

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Acquisition rentable validée sous 90 jours',
    historique_agences = '2 prestataires testés — coût par lead trop élevé'
WHERE external_id = 'F8';

UPDATE public.agence_demandes SET
    duree_souhaitee = '12 mois récurrent',
    horizon_resultat = 'Croissance digitale mesurable sous 6 mois',
    historique_agences = 'Équipe marketing interne — besoin d''un partenaire acquisition'
WHERE external_id = 'F9';

-- Rénovation (R1–R8)
UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (8–12 semaines)',
    horizon_resultat = 'Génération de devis dès le lancement des campagnes',
    historique_agences = 'Première collaboration avec une agence web'
WHERE external_id IN ('R1', 'R3', 'R5', 'R7');

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Leads locaux qualifiés sous 60 jours',
    historique_agences = 'Agence précédente — insatisfait du volume de leads'
WHERE external_id IN ('R2', 'R6');

UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (10 semaines)',
    horizon_resultat = 'Site opérationnel avant la saison haute',
    historique_agences = 'Refonte datée — site non adapté mobile'
WHERE external_id = 'R4';

UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (12 semaines)',
    horizon_resultat = 'Visibilité nationale sous 90 jours post-livraison',
    historique_agences = 'Marché public gagné — besoin de crédibilité digitale'
WHERE external_id = 'R8';

-- Grossiste (G1–G8)
UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (10–14 semaines)',
    horizon_resultat = 'Catalogue digital opérationnel sous 60 jours',
    historique_agences = 'Prestataire e-commerce précédent — intégration ERP échouée'
WHERE external_id IN ('G1', 'G7');

UPDATE public.agence_demandes SET
    duree_souhaitee = 'Projet ponctuel (8–10 semaines)',
    horizon_resultat = 'Espace pro actif avant fin d''année fiscale',
    historique_agences = 'Première collaboration avec une agence web'
WHERE external_id = 'G2';

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Pipeline B2B qualifié sous 90 jours',
    historique_agences = 'Agence généraliste — manque d''expertise B2B'
WHERE external_id IN ('G3', 'G6', 'G8');

UPDATE public.agence_demandes SET
    duree_souhaitee = '12 mois récurrent',
    horizon_resultat = 'ROI acquisition mesurable sous 6 mois',
    historique_agences = 'Migration catalogue en cours — besoin d''accompagnement'
WHERE external_id = 'G4';

UPDATE public.agence_demandes SET
    duree_souhaitee = '6–12 mois récurrent',
    horizon_resultat = 'Nouveaux comptes pros dès le 3e mois',
    historique_agences = '2 agences testées — insatisfait du ciblage B2B'
WHERE external_id = 'G5';

ALTER TABLE public.agence_demandes
    DROP CONSTRAINT agence_demandes_demande_fields;

ALTER TABLE public.agence_demandes
    ADD CONSTRAINT agence_demandes_demande_fields CHECK (
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
            AND duree_souhaitee IS NOT NULL
            AND horizon_resultat IS NOT NULL
            AND historique_agences IS NOT NULL
        )
    );

COMMENT ON COLUMN public.agence_demandes.duree_souhaitee IS
  'Durée souhaitée du projet ou de l''accompagnement (critère qualification verso).';
COMMENT ON COLUMN public.agence_demandes.horizon_resultat IS
  'Horizon de résultat attendu par l''entreprise (critère qualification verso).';
COMMENT ON COLUMN public.agence_demandes.historique_agences IS
  'Parcours antérieur avec des prestataires web (critère qualification verso).';
