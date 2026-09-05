-- Agence demandes: show original 16 in carousel from September, hide expand batch

UPDATE public.agence_demandes
SET available_from = '2026-09-01'
WHERE record_type = 'demande'
  AND sort_order BETWEEN 1 AND 16;

UPDATE public.agence_demandes
SET available_from = '2099-01-01'
WHERE record_type = 'demande'
  AND sort_order BETWEEN 18 AND 35;
