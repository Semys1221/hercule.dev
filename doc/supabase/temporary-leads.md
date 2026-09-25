# `temporary_leads`

**Decision (2026-09-24):** keep the table; do not drop after cleanup.

- **Role:** Instantly list import staging (`migrated_at`, `source_list_id`). Used by `lib/backend/streamlit_scraper/` (`supabase_leads_repo.py`).
- **Not** the target unified `public.leads` table (see `20270424130000_unified_leads_spec.sql`).
- **Security:** RLS enabled with `service_role` only (`20270424120200_rls_calendly_temporary.sql`). Anon/authenticated have no access.
- **Archive:** full export in `doc/supabase/archive/pre-drop-2026-09-24/temporary_leads.csv` before any future drop.
