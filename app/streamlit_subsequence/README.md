# Streamlit Subsequence

Operator dashboard for Instantly Interested follow-ups — CRM steps + Unibox reply sends. Multi-campaign: pick an Instantly campaign, **Initialiser** if needed, fill E1–E3, then use the same CRM.

## Onboarding

1. Select an Instantly campaign (top of the app).
2. If status is **Non initialisé**, click **Initialiser** — this upserts `instantly_bypass_config`, seeds empty E1/E2/E3 templates, and registers a `lead_interested` webhook scoped to that campaign.
3. Fill Email 1 / 2 / 3 (Setup or Templates) and save.
4. **Envois** is the same CRM as before. Send is disabled until Email 1 has a body.

Copy and webhook pause are **per campaign**. `instantly_bypass_settings` remains a global emergency kill-switch.

## CRM pipeline

| Étape | Signification | Prochain email |
|-------|---------------|----------------|
| **0** | Interested, pas encore de suivi Hercule | E1 précisions (webhook ou manuel) |
| **1** | E1 envoyé | E2 confirmation |
| **2** | E2 envoyé | E3 clôture → Not Interested (-1) |
| **3** | Séquence terminée | — |
| **Réponses à traiter** | A répondu en étape 1, 2 ou 3 | Email suggéré (E1/E2/E3) + envoi depuis Conversation |

- Fetch Instantly **Interested** only. Missing CRM row → **étape 0**.
- Reply detection (Unibox, since last Hercule send) on fetch for steps 1/2/3 → **Réponses à traiter**.
- Leads en **Réponses à traiter** sans réponse Hercule depuis **24h+** sont signalés (🔴 clignotant dans le tableau, le selectbox Conversation et le bandeau d’urgence).
- **Conversation** : chargement auto à la sélection du lead ; bloc **Répondre** avec template E1/E2/E3 pré-rempli (éditable) et envoi direct (même fenêtre d’envoi que les envois bulk).
- Auto-advance only after Streamlit or webhook sends. Manual **Déplacer** always available.
- Instantly **Interested** tag is unchanged until E3.
- All sends are **Unibox replies** in the existing thread.

## Quick start

```bash
pnpm streamlit-subsequence
pnpm smoke-streamlit-subsequence
```

1. Apply migrations through `20260914120000_campaign_scoped_templates.sql`
2. Select campaign → **Initialiser** if needed → fill sequences
3. **Envois** → Fetch Interested + sync CRM → pick étape → send or move

## Webhook (Interested Email 1 only)

- URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/instantly`
- Skips campaigns that are not initialized or whose per-campaign auto-send is paused
- Places the lead in **étape 0**, schedules that campaign’s E1 if auto-send is on (2 min human delay), then **étape 1** after send
- **Pause / activate** per campaign via **Setup**

## Send window (manual sends only)

- **Mon–Fri, 8:00–17:00 Europe/Paris** — outside this window, manual sends from **Envois** are queued in `instantly_bypass_jobs` for the next slot (e.g. click at 06:00 Paris → scheduled for 08:00 same day; Friday 18:00 → Monday 08:00).
- Webhook E1 auto-send is **scheduled 2 minutes after Interested**, 24/7 (processed by the jobs cron every 5–15 min → typical delivery 2–12 min). Manual sends from **Envois** are unchanged.
- Cron (same auth as booking emails): `GET /api/cron/instantly-bypass-jobs` every 5–15 minutes with `Authorization: Bearer $CRON_SECRET`.

## Template variables

`{{reservation_agence_link}}`, `{{first_name}}`, `{{last_name}}`, `{{company_name}}`

`{{reservation_agence_link}}` is required on send **only if** the template HTML contains that placeholder.
