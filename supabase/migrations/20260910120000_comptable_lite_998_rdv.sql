-- Align comptable demandes carousel copy with 20–25 day first RDV SLA.
UPDATE public.comptable_demandes
SET horizon_resultat = 'Premier RDV sous 20 à 25 jours'
WHERE horizon_resultat = 'Premier RDV sous 15 jours';
