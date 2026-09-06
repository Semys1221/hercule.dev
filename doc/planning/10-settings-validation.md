# 10 — Settings

Ne pas inventer un « Global Settings » si un mécanisme existe. Aujourd’hui : **env vars**, **singletons SQL**, **profile JSON**, **fichiers**, **Instantly config par campagne**. Pas de table `global_settings`.

---

## PARTIE 1 — Ce qui est valide

| Nom | Purpose | Source actuelle | Default | Qui modifie | Consommateurs | Impact |
|-----|---------|-----------------|---------|-------------|---------------|--------|
| CRON_SECRET | auth crons | env | — | ops | `/api/cron/*` | sécu |
| LINK_TRACKING_WEBHOOK_SECRET | APIs CRM + supabase WH | env | — | ops | booking-comm, WH | sécu |
| CALENDLY_* | booking | env | base URL fallback code | ops | webhook, HTML | CRM |
| RESEND_* | send + WH | env | — | ops | orchestrator | emails |
| INSTANTLY_* | outreach | env | — | ops | sync, bypass | CRM |
| BOOKING_GO_LIVE_AT | split legacy | env | 2026-09-03 | ops | orchestrator | LEG-03 |
| BOOKING_RESEND_FROM | From | env | Hercule contact@ | ops | send | copy |
| TRACKING_BASE_URL_* | URLs slug | env | hercule.dev | ops | provision | Instantly |
| instantly_bypass_settings.webhook_auto_send_enabled | pause E1 | **DB singleton** | — | Streamlit | webhook Instantly | ops |
| instantly_bypass_config.* | subsequence IDs, toggles / campagne | DB | — | Streamlit | bypass | ops |
| ai_reply_agent_settings | kill switch agent | DB | — | Streamlit | WH reply | ops |
| ai_reply_agent_config | prompts / niche | DB + fichiers prompts | — | Streamlit | Grok | ops |
| profile.communication.delays | délais produit | JSON à l’onboarding | 14/4/21… | admin fiche (futur) | **peu utilisé** par booking CRM | FND |
| funnel.json | steps sales | filesystem | — | /internal | builder | FUN-01 |
| Paris send window | heures d’envoi | **code** `send-window.ts` | — | deploy | booking + bypass | emails |

Mécanismes existants à **réutiliser** : env (secrets/URLs), singleton tables (kill switches), profile (délais par fiche), fichiers (funnels/FAQ).

---

## PARTIE 2 — Spec settings sans implémentation

`doc/documentations_2/global_settings.md` : toggle **« File d’attente 15 jours »** qui change l’Agenda (gris 6 j vs 15 j). **Pas d’Agenda** dans le code. `profile.delays.queue_warmup_days` default 15 existe déjà côté profile builder — ce n’est pas un toggle global.

#### [SET-01] Un toggle global « File d’attente 15 jours » (Agenda grisé 15 j vs 6 j) fait-il partie du produit à construire ?

- [ ] **A (recommandé)** — Oui, **plus tard** avec l’Agenda client ; implémenter comme setting **DB singleton** (même pattern que `instantly_bypass_settings`), pas un nouveau framework. Délai 15 j déjà dans profile.capacity/delays.
- [ ] **B** — Non : pas d’Agenda / pas de toggle ; les 6 j vs 15 j se gèrent par fiche (`profile`) ou pas du tout au MVP.
- [ ] **C** — Toggle **env** ou fichier, pas la DB.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Dashboard client, Calendly availability UI, capacity  
**Ancien ID :** capacity queue + global_settings.md

#### [SET-02] Les kill switches ops (bypass webhook, AI agent) restent-ils des **singletons SQL** édités dans Streamlit, hors `/internal` Next ?

- [ ] **A (recommandé)** — Oui tant que INT-02 = ops ; éventuellement un écran Next plus tard, **même tables**.
- [ ] **B** — Les migrer maintenant dans `/internal`.
- [ ] **C** — Tout passer en variables d’environnement.

**Impact si l’architecture change :** Low  
**Domaines affectés :** Streamlit, internal

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| SET-01 | | |
| SET-02 | | |
