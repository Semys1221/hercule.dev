-- Agence demandes: origine (public signal explaining why the project exists)

ALTER TABLE public.agence_demandes
    ADD COLUMN origine TEXT;

UPDATE public.agence_demandes SET origine = 'Recrutement mandataires' WHERE external_id = 'C1';
UPDATE public.agence_demandes SET origine = 'Nouveau directeur associé' WHERE external_id = 'C2';
UPDATE public.agence_demandes SET origine = 'Ouverture second bureau' WHERE external_id = 'C3';
UPDATE public.agence_demandes SET origine = 'Recrutement comptable' WHERE external_id = 'C4';
UPDATE public.agence_demandes SET origine = 'Changement de locaux' WHERE external_id = 'F1';
UPDATE public.agence_demandes SET origine = 'Recrutement conseillers' WHERE external_id = 'F2';
UPDATE public.agence_demandes SET origine = 'Nouveau gérant' WHERE external_id = 'F3';
UPDATE public.agence_demandes SET origine = 'Refonte identité' WHERE external_id = 'F4';
UPDATE public.agence_demandes SET origine = 'Expansion réseau' WHERE external_id = 'F5';
UPDATE public.agence_demandes SET origine = 'Recrutement installateurs' WHERE external_id = 'R1';
UPDATE public.agence_demandes SET origine = 'Campagne commerciale' WHERE external_id = 'R2';
UPDATE public.agence_demandes SET origine = 'Recrutement commercial' WHERE external_id = 'R3';
UPDATE public.agence_demandes SET origine = 'Marchés publics remportés' WHERE external_id = 'R4';
UPDATE public.agence_demandes SET origine = 'Migration catalogue digital' WHERE external_id = 'G1';
UPDATE public.agence_demandes SET origine = 'Nouveau directeur commercial' WHERE external_id = 'G2';
UPDATE public.agence_demandes SET origine = 'Expansion export' WHERE external_id = 'G3';

ALTER TABLE public.agence_demandes
    ADD CONSTRAINT agence_demandes_demande_origine CHECK (
        record_type = 'teaser' OR origine IS NOT NULL
    );

COMMENT ON COLUMN public.agence_demandes.origine IS
  'Short public signal explaining why the project exists (e.g. recruitment, office move).';
