# Supabase migrations — prod vs repo

**Project:** `hercule-db` (`sgituxpzobtucbsmwsmr`)

## Source of truth

1. **Applied state on prod** — `supabase_migrations.schema_migrations` (via MCP `list_migrations` or dashboard).
2. **New DDL** — add files under [`lib/backend/supabase/migrations/`](../lib/backend/supabase/migrations/) and apply with `pnpm apply-<name>` or [`migrationUtils.ts`](../lib/backend/scripts/crm/migrationUtils.ts) (Management API).

Prod history includes legacy names (`tenants_leads_*`, `lead_broker`) that are **not** replayed from the current repo folder. Do not reset prod from repo migrations alone.

## Cleanup batch (2026-09-24)

| File | Purpose |
|------|---------|
| `20270424120000_drop_marketing_demandes.sql` | Drop `*_demandes` |
| `20270424120100_decommission_agence_stack.sql` | Drop agence product tables + FK cleanup |
| `20270424120200_rls_calendly_temporary.sql` | RLS on `temporary_leads`, `calendly_seat_onboarding` |
| `20270424130000_unified_leads_spec.sql` | Creates `leads` + backfill (~29k rows) |
| `20270424140000_drop_deprecated_niche_tables.sql` | Drops `comptable`, `cif`, `comptable_delivery`; adds `payments.lead_id` / `sales_calls.lead_id` |

Repo-only migrations **never applied** to prod (safe to delete from repo if undesired): `funnel_pages`, SaaS capacity pool, `campaign_orchestrator_runs`, `deliverability_settings` (verify before removing files).

## Commands

```bash
pnpm export-supabase-cleanup-archive   # CSV backup
pnpm apply-supabase-cleanup-migrations # idempotent where IF NOT EXISTS / IF EXISTS
```

## Renames already on prod

- `jum` → `comptable_delivery` (no `jum` table)
- No `public.leads` until `20270424130000` is applied
