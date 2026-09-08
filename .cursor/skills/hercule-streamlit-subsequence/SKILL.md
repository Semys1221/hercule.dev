---
name: hercule-streamlit-subsequence
description: >-
  Hercule.dev Instantly Interested follow-up CRM (app/streamlit_subsequence).
  Use when editing subsequence, Interested leads, E1 E2 E3 templates, Unibox
  replies, instantly_bypass, lead_interested webhook, or pnpm streamlit-subsequence.
---

# Streamlit Subsequence

Operator dashboard for Instantly Interested follow-ups — CRM steps + Unibox reply sends. Human reference: [app/streamlit_subsequence/README.md](../../app/streamlit_subsequence/README.md).

## Quick start

```bash
pnpm streamlit-subsequence
pnpm smoke-streamlit-subsequence
```

Use MCP `user-instantly` for campaign/lead ops; `plugin-supabase-supabase` for `instantly_bypass_*` tables.

## Onboarding (per campaign)

1. Select Instantly campaign at top of app
2. If **Non initialisé** → **Initialiser** — upserts `instantly_bypass_config`, seeds E1/E2/E3, registers `lead_interested` webhook
3. Fill Email 1/2/3 and save
4. **Envois** — send disabled until E1 has a body

Copy and webhook pause are **per campaign**. `instantly_bypass_settings` is global emergency kill-switch.

## CRM pipeline

| Étape | Meaning | Next email |
|-------|---------|------------|
| **0** | Interested, no Hercule follow-up yet | E1 |
| **1** | E1 sent | E2 |
| **2** | E2 sent | E3 → Not Interested (-1) |
| **3** | Sequence complete | — |
| **Réponses à traiter** | Replied at step 1/2/3 | Suggested E1/E2/E3 + Conversation reply |

- Fetch Instantly **Interested** only; missing CRM row → étape 0
- Reply detection via Unibox since last Hercule send
- **24h+** without Hercule reply in Réponses à traiter → urgency UI
- All sends are **Unibox replies** in existing thread
- Auto-advance only after Streamlit or webhook sends; manual **Déplacer** always available

## Webhook (Interested E1)

- URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/instantly`
- Skips uninitialized or paused campaigns
- Places lead in étape 0, schedules E1 (2 min delay) if auto-send on, then étape 1

## Send window (manual only)

- Mon–Fri 8:00–17:00 Europe/Paris for manual **Envois**
- Outside window → queued in `instantly_bypass_jobs`
- Webhook E1 auto-send: 2 min after Interested, 24/7
- Cron: `GET /api/cron/instantly-bypass-jobs` every 5–15 min (`CRON_SECRET`)

## Template variables

`{{reservation_agence_link}}`, `{{first_name}}`, `{{last_name}}`, `{{company_name}}`

`{{reservation_agence_link}}` required on send only if template HTML contains it.

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm smoke-streamlit-subsequence` | Smoke send queue |
| `pnpm bootstrap-streamlit-subsequence-pipeline` | Bootstrap from Unibox |
| `pnpm verify-streamlit-subsequence-pipeline` | Verify bootstrap |
| `pnpm backfill-streamlit-subsequence-step0` | Backfill step 0 E1 |
| `scripts/streamlit_subsequence/*` | Export, classify, apply Unibox threads |

## Migrations

Apply through `20260914120000_campaign_scoped_templates.sql` before first use.

## Cross-links

- Provisioned from scraper: `python -m bootstrap provision-instantly --with-subsequence`
- Link variables provisioned via `streamlit_links`
