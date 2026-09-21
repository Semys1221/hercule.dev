# Backend (Hercule.dev)

Ops tooling, Python shared libraries, database migrations, and Streamlit operator apps.

| Path | Purpose |
|------|---------|
| `lib/backend/scripts/` | CRM migrations, cron setup, smoke tests, VPS/Render deploy helpers |
| `lib/backend/shared/` | Python clients shared by Streamlit apps and scripts |
| `lib/backend/supabase/migrations/` | SQL migrations applied via `lib/backend/scripts/crm/*` |
| `lib/backend/streamlit_*` | Operator dashboards (scraper, subsequence, reply agent, …) |
| `lib/backend/outreach_data.py` | Persistent data path helpers (`HERCULE_DATA_ROOT`) |
| `lib/backend/tmp/` | Local script outputs (gitignored) |

## Environment

Load `.env` from the **repo root**. Python imports:

```bash
export PYTHONPATH="${REPO_ROOT}/lib/backend:${REPO_ROOT}"
```

## Run Streamlit apps

From repo root via pnpm, e.g. `pnpm streamlit-scraper`, `pnpm streamlit-subsequence`.
