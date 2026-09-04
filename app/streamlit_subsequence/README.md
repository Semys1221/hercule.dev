# Streamlit Subsequence

Bypass Instantly native subsequence delays by sending follow-ups via the Unibox Reply API.

## Components

| Component | Path |
|-----------|------|
| Webhook (production, Positive Email 1 only) | `app/api/webhooks/instantly/route.ts` |
| Core logic (TS) | `lib/instantly-bypass/` |
| Streamlit dashboard | `app/streamlit_subsequence/streamlit_app.py` |
| Send queues (Python) | `app/streamlit_subsequence/send_queue.py` |

## Model

| Sequence | Email 1 | Email 2 | Email 3 |
|----------|---------|---------|---------|
| **Positive Reply** | Auto via webhook (prod) + manual backlog in **Envois** | Dashboard bulk | Dashboard bulk |
| **No Reply** | Dashboard manual only | Dashboard bulk | — |

- **No cron jobs** — all follow-ups except webhook Email 1 are operator-triggered from Streamlit.
- **Reply detection:** leads who replied since the previous step are unchecked by default.
- **Positive Reply queues:** non-Interested leads are hidden.

## Quick start

1. Apply migrations:
   - `supabase/migrations/20260909120000_instantly_bypass.sql`
   - `supabase/migrations/20260909130000_instantly_bypass_followups.sql`
2. Copy `app/streamlit_subsequence/.env.example` values into repo `.env` or `crm/.env`
3. Run Streamlit: `pnpm streamlit-subsequence` (from repo root)
4. In **Setup** tab: save campaign config, register `lead_interested` webhook
5. Use **Envois** tab for manual/backlog and follow-up sends
6. Smoke test (mocked, no Instantly): `pnpm smoke-streamlit-subsequence`
7. Smoke test webhook: `pnpm smoke-instantly-bypass-webhook`

## Webhook

- Event: `lead_interested`
- URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/instantly`
- Auth: `Authorization: Bearer {INSTANTLY_BYPASS_WEBHOOK_SECRET}`

Requires Instantly Hypergrowth+ plan for webhooks. Webhook only handles **Positive Reply Email 1**; everything else runs from the dashboard (local or prod).

## Rate limits

Bulk sends throttle to ~3 s between Instantly `/emails` calls (~20 req/min).
