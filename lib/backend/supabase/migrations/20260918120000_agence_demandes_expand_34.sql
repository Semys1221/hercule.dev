-- Agence demandes: expand to 34 planned demandes (80% acquisition, max Nov 2026)

-- 1. Adjust existing 16 demandes
UPDATE public.agence_demandes SET
    prestation = 'Acquisition SEO + positionnement digital',
    available_until = '2026-11-30'
WHERE external_id = 'F1';

UPDATE public.agence_demandes SET
    prestation = 'Acquisition organique + prise de rendez-vous',
    disponibilite = 'Octobre–Novembre',
    available_until = '2026-11-30'
WHERE external_id = 'F4';

UPDATE public.agence_demandes SET
    prestation = 'Acquisition SEO + génération de devis',
    available_until = '2026-11-30'
WHERE external_id = 'R1';

UPDATE public.agence_demandes SET available_until = '2026-11-30' WHERE external_id IN (
    'C1', 'C2', 'C3', 'C4', 'F2', 'F3', 'F5', 'R2', 'R3', 'R4', 'G1', 'G2', 'G3'
);

UPDATE public.agence_demandes SET
    disponibilite = 'Novembre',
    available_from = '2026-11-01',
    available_until = '2026-11-30'
WHERE external_id = 'F5';

UPDATE public.agence_demandes SET status = 'assigned' WHERE external_id IN ('C2', 'F1', 'R3', 'G1');

-- 2. Insert 18 new demandes (sort_order 18–35)
INSERT INTO public.agence_demandes (
    external_id, record_type, niche, secteur,
    prestation, budget, taille, zone, disponibilite,
    origine, status, available_from, available_until, sort_order
) VALUES
    ('C5', 'demande', 'comptabilite', 'Comptabilité',
     'SEO local + création de contenus', '1 500–2 500 €/mois', '9 mandataires', 'Bretagne', 'Octobre',
     'Recrutement mandataires', 'available', '2026-10-01', '2026-11-30', 18),
    ('C6', 'demande', 'comptabilite', 'Comptabilité',
     'Acquisition SEO + SEA', '2 000–3 500 €/mois', '15 collaborateurs', 'Normandie', 'Octobre–Novembre',
     'Ouverture second bureau', 'assigned', '2026-10-01', '2026-11-30', 19),
    ('C7', 'demande', 'comptabilite', 'Comptabilité',
     'Acquisition payante + landing pages', '1 800–3 000 €/mois', '6 mandataires', 'Île-de-France', 'Novembre',
     'Recrutement comptable', 'available', '2026-11-01', '2026-11-30', 20),
    ('C8', 'demande', 'comptabilite', 'Comptabilité',
     'Refonte site vitrine + SEO', '4 000–7 000 €', '19 collaborateurs', 'Hauts-de-France', 'Novembre',
     'Nouveau directeur associé', 'available', '2026-11-01', '2026-11-30', 21),
    ('F6', 'demande', 'conseil-financier', 'Conseil financier',
     'SEO B2B + contenu organique', '1 800–3 000 €/mois', '12 conseillers', 'France', 'Octobre',
     'Recrutement conseillers', 'available', '2026-10-01', '2026-11-30', 22),
    ('F7', 'demande', 'conseil-financier', 'Conseil financier',
     'Acquisition SEA + retargeting', '2 000–3 500 €/mois', '8 conseillers', 'Île-de-France', 'Octobre–Novembre',
     'Croissance commerciale', 'available', '2026-10-01', '2026-11-30', 23),
    ('F8', 'demande', 'conseil-financier', 'Conseil financier',
     'Landing pages + acquisition payante', '2 000–3 500 €/mois', '16 collaborateurs', 'Auvergne-Rhône-Alpes', 'Novembre',
     'Expansion réseau', 'assigned', '2026-11-01', '2026-11-30', 24),
    ('F9', 'demande', 'conseil-financier', 'Conseil financier',
     'Acquisition digitale complète', '2 500–4 000 €/mois', '22 collaborateurs', 'PACA', 'Novembre',
     'Nouveau gérant', 'available', '2026-11-01', '2026-11-30', 25),
    ('F10', 'demande', 'conseil-financier', 'Conseil financier',
     'Refonte site institutionnel', '5 000–8 000 €', '10 conseillers', 'Bourgogne-Franche-Comté', 'Novembre',
     'Refonte identité', 'available', '2026-11-01', '2026-11-30', 26),
    ('R5', 'demande', 'renovation', 'Solaire',
     'Acquisition locale + SEO', '1 500–2 500 €/mois', '14 salariés', 'Centre-Val de Loire', 'Octobre–Novembre',
     'Recrutement installateurs', 'available', '2026-10-01', '2026-11-30', 27),
    ('R6', 'demande', 'renovation', 'Pompe à chaleur',
     'Acquisition payante + landing pages', '1 800–3 000 €/mois', '11 salariés', 'Pays de la Loire', 'Novembre',
     'Campagne commerciale', 'assigned', '2026-11-01', '2026-11-30', 28),
    ('R7', 'demande', 'renovation', 'Piscines',
     'SEO + génération de devis', '1 500–2 500 €/mois', '7 salariés', 'France', 'Novembre',
     'Recrutement commercial', 'available', '2026-11-01', '2026-11-30', 29),
    ('R8', 'demande', 'renovation', 'Rénovation énergétique',
     'Refonte site + acquisition SEO', '4 000–7 000 €', '28 salariés', 'France', 'Novembre',
     'Marchés publics remportés', 'available', '2026-11-01', '2026-11-30', 30),
    ('G4', 'demande', 'grossiste', 'Grossiste emballage',
     'Acquisition B2B + SEO', '2 000–3 500 €/mois', '31 salariés', 'France', 'Octobre–Novembre',
     'Migration catalogue digital', 'assigned', '2026-10-01', '2026-11-30', 31),
    ('G5', 'demande', 'grossiste', 'Fournitures médicales',
     'Acquisition organique + SEA', '2 500–4 000 €/mois', '45 salariés', 'France', 'Novembre',
     'Nouveau directeur commercial', 'available', '2026-11-01', '2026-11-30', 32),
    ('G6', 'demande', 'grossiste', 'Distribution professionnelle',
     'SEO + acquisition payante B2B', '2 000–3 500 €/mois', '21 salariés', 'Europe', 'Novembre',
     'Expansion export', 'available', '2026-11-01', '2026-11-30', 33),
    ('G7', 'demande', 'grossiste', 'Grossiste emballage',
     'Refonte e-commerce B2B', '8 000–15 000 €', '34 salariés', 'France', 'Novembre',
     'Fusion / acquisition', 'available', '2026-11-01', '2026-11-30', 34),
    ('G8', 'demande', 'grossiste', 'Distribution professionnelle',
     'Acquisition SEO + SEA B2B', '2 500–4 000 €/mois', '18 salariés', 'France', 'Novembre',
     'Changement de locaux', 'available', '2026-11-01', '2026-11-30', 35);

-- 3. Teaser stays last in carousel
UPDATE public.agence_demandes SET sort_order = 36 WHERE external_id = 'AVENIR-SANTE';
