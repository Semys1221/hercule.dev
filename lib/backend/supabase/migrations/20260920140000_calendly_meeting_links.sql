-- Persist Calendly meeting action links on booked leads (join / reschedule / cancel).

ALTER TABLE public.agence
    ADD COLUMN IF NOT EXISTS calendly_join_url TEXT,
    ADD COLUMN IF NOT EXISTS calendly_reschedule_url TEXT,
    ADD COLUMN IF NOT EXISTS calendly_cancel_url TEXT,
    ADD COLUMN IF NOT EXISTS calendly_links_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS calendly_links_sync_error TEXT;

ALTER TABLE public.entreprise
    ADD COLUMN IF NOT EXISTS calendly_join_url TEXT,
    ADD COLUMN IF NOT EXISTS calendly_reschedule_url TEXT,
    ADD COLUMN IF NOT EXISTS calendly_cancel_url TEXT,
    ADD COLUMN IF NOT EXISTS calendly_links_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS calendly_links_sync_error TEXT;

COMMENT ON COLUMN public.agence.calendly_join_url IS
  'Calendly event join URL (virtual location), synced at booking.';
COMMENT ON COLUMN public.agence.calendly_reschedule_url IS
  'Invitee-specific Calendly reschedule URL, synced at booking.';
COMMENT ON COLUMN public.agence.calendly_cancel_url IS
  'Invitee-specific Calendly cancel URL, synced at booking.';
COMMENT ON COLUMN public.agence.calendly_links_synced_at IS
  'When meeting action links were last successfully synced from Calendly.';
COMMENT ON COLUMN public.agence.calendly_links_sync_error IS
  'Last Calendly link sync error; null when synced successfully.';

COMMENT ON COLUMN public.entreprise.calendly_join_url IS
  'Calendly event join URL (virtual location), synced at booking.';
COMMENT ON COLUMN public.entreprise.calendly_reschedule_url IS
  'Invitee-specific Calendly reschedule URL, synced at booking.';
COMMENT ON COLUMN public.entreprise.calendly_cancel_url IS
  'Invitee-specific Calendly cancel URL, synced at booking.';
COMMENT ON COLUMN public.entreprise.calendly_links_synced_at IS
  'When meeting action links were last successfully synced from Calendly.';
COMMENT ON COLUMN public.entreprise.calendly_links_sync_error IS
  'Last Calendly link sync error; null when synced successfully.';

CREATE INDEX IF NOT EXISTS agence_calendly_links_unsynced_idx
    ON public.agence (calendly_links_synced_at)
    WHERE statut IN ('MEETING_BOOKED', 'CONFIRMED', 'BOOKED')
      AND calendly_links_synced_at IS NULL
      AND calendly_invitee_uri IS NOT NULL;

CREATE INDEX IF NOT EXISTS entreprise_calendly_links_unsynced_idx
    ON public.entreprise (calendly_links_synced_at)
    WHERE statut IN ('MEETING_BOOKED', 'CONFIRMED', 'BOOKED')
      AND calendly_links_synced_at IS NULL
      AND calendly_invitee_uri IS NOT NULL;
