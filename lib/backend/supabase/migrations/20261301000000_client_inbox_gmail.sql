-- Engin admin: Gmail-synced client messaging (thomas@hercule.dev).

CREATE TABLE IF NOT EXISTS public.client_inbox_sync_state (
    mailbox             TEXT PRIMARY KEY,
    history_id          TEXT,
    watch_expiration    TIMESTAMPTZ,
    last_sync_at        TIMESTAMPTZ,
    last_error          TEXT
);

COMMENT ON TABLE public.client_inbox_sync_state IS
    'Gmail users.watch + history cursor per mailbox.';

CREATE TABLE IF NOT EXISTS public.client_inbox_threads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    gmail_thread_id     TEXT NOT NULL UNIQUE,
    subject             TEXT NOT NULL DEFAULT '',
    snippet             TEXT NOT NULL DEFAULT '',
    last_message_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_direction      TEXT NOT NULL DEFAULT 'in'
                            CHECK (last_direction IN ('in', 'out')),
    needs_reply         BOOLEAN NOT NULL DEFAULT FALSE,
    ambiguous_client    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_inbox_threads_client_last_msg_idx
    ON public.client_inbox_threads (client_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS client_inbox_threads_needs_reply_idx
    ON public.client_inbox_threads (needs_reply, last_message_at DESC)
    WHERE needs_reply = TRUE;

COMMENT ON TABLE public.client_inbox_threads IS
    'One row per Gmail thread matched to a conference client.';

CREATE TABLE IF NOT EXISTS public.client_inbox_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id           UUID NOT NULL REFERENCES public.client_inbox_threads(id) ON DELETE CASCADE,
    gmail_message_id    TEXT NOT NULL UNIQUE,
    direction           TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    from_email          TEXT NOT NULL DEFAULT '',
    to_emails           TEXT[] NOT NULL DEFAULT '{}',
    subject             TEXT NOT NULL DEFAULT '',
    body_text           TEXT NOT NULL DEFAULT '',
    body_html           TEXT,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_headers         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_inbox_messages_thread_sent_idx
    ON public.client_inbox_messages (thread_id, sent_at ASC);

COMMENT ON TABLE public.client_inbox_messages IS
    'Messages synced from Gmail for client threads.';

CREATE TABLE IF NOT EXISTS public.client_inbox_thread_state (
    thread_id           UUID PRIMARY KEY REFERENCES public.client_inbox_threads(id) ON DELETE CASCADE,
    read_at             TIMESTAMPTZ,
    snoozed_until       TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ
);

COMMENT ON TABLE public.client_inbox_thread_state IS
    'Engin-only UI state (read, snooze, resolved).';

CREATE TABLE IF NOT EXISTS public.client_inbox_drafts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    thread_id           UUID REFERENCES public.client_inbox_threads(id) ON DELETE CASCADE,
    subject             TEXT NOT NULL DEFAULT '',
    body                TEXT NOT NULL DEFAULT '',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_inbox_drafts_client_new_idx
    ON public.client_inbox_drafts (client_id)
    WHERE thread_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS client_inbox_drafts_client_thread_idx
    ON public.client_inbox_drafts (client_id, thread_id)
    WHERE thread_id IS NOT NULL;

COMMENT ON TABLE public.client_inbox_drafts IS
    'Composer drafts in Engin client inbox.';

ALTER TABLE public.client_inbox_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_inbox_thread_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_inbox_drafts ENABLE ROW LEVEL SECURITY;
