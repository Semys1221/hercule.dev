-- Additional lead statuses for link tracking flow.

ALTER TYPE public.lead_statut ADD VALUE IF NOT EXISTS 'CLICKED';
ALTER TYPE public.lead_statut ADD VALUE IF NOT EXISTS 'CANCELLED';
