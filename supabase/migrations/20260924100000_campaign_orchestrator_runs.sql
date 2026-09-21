-- Idempotency log for one-shot campaign orchestration runs (e.g. restaurant switch).

CREATE TABLE IF NOT EXISTS public.campaign_orchestrator_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_orchestrator_runs_created_at_idx
  ON public.campaign_orchestrator_runs (created_at DESC);

COMMENT ON TABLE public.campaign_orchestrator_runs IS
  'Audit + idempotency for campaign orchestration cron jobs (pause all / activate one).';

ALTER TABLE public.campaign_orchestrator_runs ENABLE ROW LEVEL SECURITY;
