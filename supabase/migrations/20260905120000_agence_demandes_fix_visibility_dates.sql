-- Agence demandes: recalibrate September batch visibility window

UPDATE public.agence_demandes
SET available_from = '2026-09-01'
WHERE record_type = 'demande'
  AND external_id IN ('C1', 'C2', 'C3', 'C4');
