-- Manual ops tasks on conference clients (Engin admin).

CREATE TABLE IF NOT EXISTS public.client_ops_tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    due_at      TIMESTAMPTZ,
    status      TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'done')),
    done_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.client_ops_tasks IS
    'Ops checklist tasks created from Engin admin, scoped to one conference client.';

CREATE INDEX IF NOT EXISTS client_ops_tasks_client_id_idx
    ON public.client_ops_tasks (client_id, status, created_at DESC);

ALTER TABLE public.client_ops_tasks ENABLE ROW LEVEL SECURITY;
