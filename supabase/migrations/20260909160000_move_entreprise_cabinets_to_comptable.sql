-- Move cabinet outreach leads from entreprise → comptable (preserve UUIDs).
-- Keep seed-bravo / seed-acme in entreprise (matches.entreprise_id FK).

INSERT INTO public.comptable (
    id,
    email,
    statut,
    slug,
    instantly_lead_id,
    instantly_campaign_id,
    calendly_invitee_uri,
    booked_at,
    instantly_synced_at,
    first_name,
    company,
    calendly_payload,
    calendly_questions,
    scheduled_at,
    confirmed_at,
    instantly_confirmed_synced_at,
    calendly_join_url,
    calendly_reschedule_url,
    calendly_cancel_url,
    calendly_links_synced_at,
    calendly_links_sync_error,
    reservation_comptable_link,
    confirmation_comptable_link,
    dashboard_link,
    product_statut,
    onboarding_completed_at,
    profile,
    retraction_status,
    created_at,
    updated_at
)
SELECT
    e.id,
    e.email,
    e.statut,
    e.slug,
    e.instantly_lead_id,
    e.instantly_campaign_id,
    e.calendly_invitee_uri,
    e.booked_at,
    e.instantly_synced_at,
    e.first_name,
    e.company,
    e.calendly_payload,
    COALESCE(e.calendly_questions, '{}'::jsonb),
    e.scheduled_at,
    e.confirmed_at,
    e.instantly_confirmed_synced_at,
    e.calendly_join_url,
    e.calendly_reschedule_url,
    e.calendly_cancel_url,
    e.calendly_links_synced_at,
    e.calendly_links_sync_error,
    e.reservation_entreprise_link,
    e.confirmation_agence_link,
    'https://www.hercule.dev/dashboard/' || e.slug,
    e.product_statut,
    e.onboarding_completed_at,
    e.profile,
    'n_a',
    e.created_at,
    e.updated_at
FROM public.entreprise e
WHERE e.email NOT IN ('seed-bravo@example.com', 'seed-acme@example.com')
ON CONFLICT (id) DO NOTHING;

-- Remap booking email jobs for migrated cabinet leads.
UPDATE public.booking_email_jobs j
SET lead_category = 'comptable'
FROM public.entreprise e
WHERE j.lead_category = 'entreprise'
  AND j.lead_id = e.id
  AND e.email NOT IN ('seed-bravo@example.com', 'seed-acme@example.com');

-- Copy entreprise booking templates to comptable when missing.
INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
SELECT 'comptable', t.email_type, t.subject, t.body, t.updated_at
FROM public.booking_email_templates t
WHERE t.category = 'entreprise'
ON CONFLICT (category, email_type) DO NOTHING;

-- Backfill sales_calls for booked cabinet leads (skipped while category was entreprise).
-- One row per calendly_invitee_uri (shared slots deduped).
INSERT INTO public.sales_calls (
    comptable_id,
    email,
    calendly_invitee_uri,
    scheduled_at,
    status,
    notes
)
SELECT DISTINCT ON (c.calendly_invitee_uri)
    c.id,
    lower(trim(c.email)),
    c.calendly_invitee_uri,
    c.scheduled_at,
    'scheduled',
    '{}'::jsonb
FROM public.comptable c
WHERE c.statut IN ('MEETING_BOOKED', 'CONFIRMED', 'BOOKED')
  AND c.calendly_invitee_uri IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.sales_calls sc
    WHERE sc.calendly_invitee_uri = c.calendly_invitee_uri
  )
ORDER BY c.calendly_invitee_uri, c.booked_at NULLS LAST, c.id;

-- Remove migrated rows from entreprise (matching seeds remain).
DELETE FROM public.entreprise
WHERE email NOT IN ('seed-bravo@example.com', 'seed-acme@example.com');

COMMENT ON TABLE public.entreprise IS
  'TPE / matching seller leads only. Cabinet outreach lives in comptable.';
