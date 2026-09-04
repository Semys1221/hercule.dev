# Streamlit Subsequence

Operator dashboard for Instantly Interested follow-ups — CRM steps + Unibox reply sends.

## CRM pipeline

| Étape | Signification | Prochain email |
|-------|---------------|----------------|
| **0** | Interested, pas encore de suivi Hercule | E1 précisions (webhook ou manuel) |
| **1** | E1 envoyé | E2 confirmation |
| **2** | E2 envoyé | E3 clôture → Not Interested (-1) |
| **3** | Séquence terminée | — |
| **Réponses à traiter** | A répondu en étape 1, 2 ou 3 | Déplacer manuellement puis envoyer |

- Fetch Instantly **Interested** only. Missing CRM row → **étape 0**.
- Reply detection (Unibox, since last Hercule send) on fetch for steps 1/2/3 → **Réponses à traiter**.
- Auto-advance only after Streamlit or webhook sends. Manual **Déplacer** always available.
- Instantly **Interested** tag is unchanged until E3.
- All sends are **Unibox replies** in the existing thread.

## Quick start

```bash
pnpm streamlit-subsequence
pnpm smoke-streamlit-subsequence
```

1. Apply migrations through `20260912120000_pipeline_crm.sql`
2. Configure campaign in **Setup**
3. **Envois** → Fetch Interested + sync CRM → pick étape → send or move

## Webhook (Interested Email 1 only)

- URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/instantly`
- Places the lead in **étape 0**, sends E1 if auto-send is on, then **étape 1**
- **Pause / activate** via **Setup → Webhook registration** (Supabase `instantly_bypass_settings`)

## Template variables

`{{reservation_agence_link}}`, `{{first_name}}`, `{{last_name}}`, `{{company_name}}`
