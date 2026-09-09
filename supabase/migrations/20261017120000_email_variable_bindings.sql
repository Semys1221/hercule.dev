-- Email variable bindings per niche (patch_bookings §3.4 runtime SoT)

CREATE TABLE public.email_variable_bindings (
  niche text NOT NULL CHECK (niche IN ('agence', 'comptable', 'entreprise')),
  variable_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  base_url_preview text,
  PRIMARY KEY (niche, variable_key)
);

ALTER TABLE public.email_variable_bindings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.email_variable_bindings IS
  'Enabled template variables per niche for sequence editors and verify (Phase 3 read path).';

INSERT INTO public.email_variable_bindings (niche, variable_key, enabled)
VALUES
  ('agence', 'firstNameLine', true),
  ('agence', 'date', true),
  ('agence', 'heure', true),
  ('agence', 'confirmation_agence_link', true),
  ('agence', 'confirmLink', true),
  ('agence', 'post_booking_link', true),
  ('agence', 'reservation_agence_link', true),
  ('agence', 'dashboardLink', true),
  ('agence', 'email', true),
  ('agence', 'company', true),
  ('comptable', 'firstNameLine', true),
  ('comptable', 'date', true),
  ('comptable', 'heure', true),
  ('comptable', 'confirmation_comptable_link', true),
  ('comptable', 'confirmLink', true),
  ('comptable', 'reservation_comptable_link', true),
  ('comptable', 'dashboardLink', true),
  ('comptable', 'email', true),
  ('comptable', 'company', true),
  ('entreprise', 'firstNameLine', true),
  ('entreprise', 'date', true),
  ('entreprise', 'heure', true),
  ('entreprise', 'confirmLink', true),
  ('entreprise', 'post_booking_link', true),
  ('entreprise', 'dashboardLink', true),
  ('entreprise', 'email', true),
  ('entreprise', 'company', true)
ON CONFLICT (niche, variable_key) DO NOTHING;
