-- SaaS autonome — control plane capacity (pool partagé, slots clients, inbox, assignments)

-- 1. Prospect pool (stock partagé post-scrape, avant assignation client)
CREATE TABLE IF NOT EXISTS public.prospect_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  niche TEXT NOT NULL CHECK (niche IN ('restaurant', 'sante', 'btp')),
  source_preset TEXT,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'in_sequence', 'booked', 'exhausted', 'cooloff')),
  cooloff_until TIMESTAMPTZ,
  tap_count INTEGER NOT NULL DEFAULT 0,
  last_tap_at TIMESTAMPTZ,
  assigned_client_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS prospect_pool_email_niche_idx
  ON public.prospect_pool (email, niche);
CREATE UNIQUE INDEX IF NOT EXISTS prospect_pool_email_niche_lower_idx
  ON public.prospect_pool (lower(trim(email)), niche);
CREATE INDEX IF NOT EXISTS prospect_pool_status_niche_idx
  ON public.prospect_pool (status, niche);
CREATE INDEX IF NOT EXISTS prospect_pool_cooloff_idx
  ON public.prospect_pool (cooloff_until)
  WHERE cooloff_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospect_pool_available_idx
  ON public.prospect_pool (niche, created_at)
  WHERE status = 'available';

COMMENT ON TABLE public.prospect_pool IS
  'Shared evergreen prospect stock (restaurant/sante/btp) before client assignment.';

-- 2. Client outreach slots (1 paying agence client = 1 slot)
CREATE TABLE IF NOT EXISTS public.client_outreach_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agence_id UUID NOT NULL REFERENCES public.agence(id) ON DELETE CASCADE,
  niche_preferences JSONB NOT NULL DEFAULT '{"restaurant":1,"sante":1,"btp":1}'::jsonb,
  inbox_allocation INTEGER NOT NULL DEFAULT 30 CHECK (inbox_allocation > 0),
  capacity_status TEXT NOT NULL DEFAULT 'queued_warmup'
    CHECK (capacity_status IN ('queued_warmup', 'active', 'paused', 'churned')),
  rdv_goal_monthly INTEGER NOT NULL DEFAULT 10,
  instantly_campaign_id TEXT,
  instantly_list_id TEXT,
  calendly_scheduling_url TEXT,
  queue_position INTEGER,
  activated_at TIMESTAMPTZ,
  estimated_activation_at TIMESTAMPTZ,
  sends_this_month INTEGER NOT NULL DEFAULT 0,
  sends_month_key TEXT,
  rdv_booked_this_month INTEGER NOT NULL DEFAULT 0,
  rdv_month_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_outreach_slots_agence_uidx
  ON public.client_outreach_slots (agence_id);
CREATE INDEX IF NOT EXISTS client_outreach_slots_status_idx
  ON public.client_outreach_slots (capacity_status);

COMMENT ON TABLE public.client_outreach_slots IS
  'SaaS autonomous — one outreach slot per paying agence client (30 inbox, 10 RDV/mois).';

ALTER TABLE public.prospect_pool
  DROP CONSTRAINT IF EXISTS prospect_pool_assigned_client_fkey;
ALTER TABLE public.prospect_pool
  ADD CONSTRAINT prospect_pool_assigned_client_fkey
  FOREIGN KEY (assigned_client_id) REFERENCES public.client_outreach_slots(id)
  ON DELETE SET NULL;

-- 3. Inbox pool (Instantly accounts attached to a slot)
CREATE TABLE IF NOT EXISTS public.inbox_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  instantly_account_id TEXT,
  client_slot_id UUID REFERENCES public.client_outreach_slots(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'warmup'
    CHECK (status IN ('warmup', 'active', 'paused', 'retired')),
  warmup_started_at TIMESTAMPTZ,
  daily_send_cap INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inbox_pool_email_uidx
  ON public.inbox_pool (email);
CREATE UNIQUE INDEX IF NOT EXISTS inbox_pool_email_lower_uidx
  ON public.inbox_pool (lower(trim(email)));
CREATE INDEX IF NOT EXISTS inbox_pool_slot_status_idx
  ON public.inbox_pool (client_slot_id, status);

COMMENT ON TABLE public.inbox_pool IS
  'Inventory of Instantly inboxes assigned to SaaS client slots.';

-- 4. Inbox provision queue (semi-auto admin file)
CREATE TABLE IF NOT EXISTS public.inbox_provision_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slot_id UUID NOT NULL REFERENCES public.client_outreach_slots(id) ON DELETE CASCADE,
  inboxes_requested INTEGER NOT NULL DEFAULT 30,
  inboxes_provisioned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS inbox_provision_queue_status_idx
  ON public.inbox_provision_queue (status, created_at);

COMMENT ON TABLE public.inbox_provision_queue IS
  'Semi-auto admin queue: order Instantly DFY / domains for a client slot.';

-- 5. Lead assignments (prospect → client routing trace)
CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospect_pool(id) ON DELETE CASCADE,
  client_slot_id UUID NOT NULL REFERENCES public.client_outreach_slots(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sequence_state TEXT NOT NULL DEFAULT 'tap1_pending'
    CHECK (sequence_state IN (
      'tap1_pending', 'tap1_sent', 'tap2_pending', 'tap2_sent', 'cooloff', 'booked', 'replied'
    )),
  tap1_sent_at TIMESTAMPTZ,
  tap2_sent_at TIMESTAMPTZ,
  instantly_lead_id TEXT,
  link_tracking_slug TEXT,
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_assignments_prospect_active_uidx
  ON public.lead_assignments (prospect_id)
  WHERE sequence_state NOT IN ('cooloff', 'booked');
CREATE INDEX IF NOT EXISTS lead_assignments_slot_state_idx
  ON public.lead_assignments (client_slot_id, sequence_state);
CREATE INDEX IF NOT EXISTS lead_assignments_tap2_due_idx
  ON public.lead_assignments (tap1_sent_at)
  WHERE sequence_state = 'tap1_sent';

COMMENT ON TABLE public.lead_assignments IS
  'Router trace: prospect assigned to client slot with double-tap sequence state.';

-- 6. Router run logs (ops visibility)
CREATE TABLE IF NOT EXISTS public.pool_router_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  assigned_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 7. updated_at triggers
CREATE OR REPLACE FUNCTION public.set_saas_capacity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prospect_pool_updated_at ON public.prospect_pool;
CREATE TRIGGER prospect_pool_updated_at
  BEFORE UPDATE ON public.prospect_pool
  FOR EACH ROW EXECUTE FUNCTION public.set_saas_capacity_updated_at();

DROP TRIGGER IF EXISTS client_outreach_slots_updated_at ON public.client_outreach_slots;
CREATE TRIGGER client_outreach_slots_updated_at
  BEFORE UPDATE ON public.client_outreach_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_saas_capacity_updated_at();

DROP TRIGGER IF EXISTS inbox_pool_updated_at ON public.inbox_pool;
CREATE TRIGGER inbox_pool_updated_at
  BEFORE UPDATE ON public.inbox_pool
  FOR EACH ROW EXECUTE FUNCTION public.set_saas_capacity_updated_at();

DROP TRIGGER IF EXISTS inbox_provision_queue_updated_at ON public.inbox_provision_queue;
CREATE TRIGGER inbox_provision_queue_updated_at
  BEFORE UPDATE ON public.inbox_provision_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_saas_capacity_updated_at();

DROP TRIGGER IF EXISTS lead_assignments_updated_at ON public.lead_assignments;
CREATE TRIGGER lead_assignments_updated_at
  BEFORE UPDATE ON public.lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_saas_capacity_updated_at();

-- 8. Extend payments.offer_type for autonomous SaaS SKU
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_offer_type_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_offer_type_check
  CHECK (offer_type IN (
    'monthly_1489',
    'pack_989x3',
    'starter_1489_5',
    'starter_998_5',
    'growth_1498_10',
    'monthly_1499',
    'pack_3x1499',
    'starter_999_5',
    'comptable_acquisition_1489_1m',
    'hercule_liberal_1200_monthly',
    'saas_autonome_10rdv'
  ));

ALTER TABLE public.prospect_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_outreach_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_provision_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_router_runs ENABLE ROW LEVEL SECURITY;
