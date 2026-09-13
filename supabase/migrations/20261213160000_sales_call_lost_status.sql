-- Mark commercial calls as lost (no follow-up sequence).
ALTER TYPE public.sales_call_status ADD VALUE IF NOT EXISTS 'lost';
