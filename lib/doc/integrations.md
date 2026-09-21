# Integrations

Pour chaque service : rôle, données, événements, auth, erreurs.  
Séparer clairement **outil** vs **business logic**.

---

## 1. Supabase (PostgreSQL)

| | |
|--|--|
| **Rôle** | Persistance d'état, files de jobs, templates, config |
| **Auth** | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server) |
| **Données** | Voir [`data-model.md`](./data-model.md) |
| **Événements** | DB webhook optionnel → `/api/webhooks/supabase-link-tracking` |
| **Erreurs** | Disconnect mid-batch (provision) ; RLS bloque anon |
| **Statut** | EXISTANT — SoT data |

Ce n'est **pas** le moteur métier. Les orchestrateurs Next/Python écrivent l'état ici.

---

## 2. Instantly

| | |
|--|--|
| **Rôle** | Cold outreach, Unibox replies, custom variables, interest status |
| **Auth** | `INSTANTLY_API_KEY` |
| **Client TS** | `lib/instantly.ts` |
| **Client Python** | `lib/backend/shared/instantly_client.py` |

### Données envoyées

- Leads (email, first/last, company, custom vars)
- PATCH variables : `reservation_*_link`, `confirmation_*_link`, `statut`, …
- Unibox reply body (bypass / AI)
- Interest status updates

### Données reçues

- Campaign/list analytics
- Lead records, Unibox threads
- Webhooks : `lead_interested`, reply events

### Webhooks

| Route | Event |
|-------|-------|
| `/api/webhooks/instantly` | Interested → bypass E1 |
| `/api/webhooks/instantly/reply` | AI reply enqueue |
| `/api/webhooks/instantly/provision-*` | Segment provision (legacy JUM etc.) |

### Erreurs / contraintes

- Rate limits → retry/transient helpers
- **LEG-02** : un seul runtime envoie (Next bypass, pas double Streamlit)
- Templates doivent contenir les variables provisionnées

### Statut

EXISTANT — cœur du module Sending.

---

## 3. Calendly

| | |
|--|--|
| **Rôle** | Booking ; org Hercule ; agendas clients connectés |
| **Auth** | `CALENDLY_API_TOKEN`, `CALENDLY_WEBHOOK_SIGNING_KEY` |
| **Lib** | `lib/legacy/calendly/**` |

### Modèle org (métier)

1. Hercule possède l'organisation Calendly
2. Client reçoit une **invitation** org Hercule
3. Client connecte son agenda
4. Event type **par client** (métier confirmé)
5. Lien dans emails Instantly = scheduling URL / event type de ce client
6. RDV tombe dans le calendrier connecté du client

**EXISTANT** : seat onboarding (`calendly_seat_onboarding`), webhook book/cancel, availability APIs.  
**À CONSTRUIRE** : routing systématique event-type-par-client pour toutes les niches actives.  
**À DÉCIDER** : détails exacts du flow invite (API vs manuel admin).

### Webhooks

| Event | Effet |
|-------|-------|
| `invitee.created` | book-lead |
| `invitee.canceled` | reset + cancel jobs |

Pas de webhook no-show fiable.

### Erreurs

- Signature invalide
- Event type wrong URI
- Seat invite pending trop long → reminder cron

---

## 4. Resend

| | |
|--|--|
| **Rôle** | Emails transactionnels booking / product / nurture |
| **Auth** | `RESEND_API_KEY`, from `BOOKING_RESEND_FROM` / `RESEND_FROM` |
| **Client** | `lib/resend.ts` |

### Flux

Jobs Supabase → cron → React Email render → Resend send → store message-id (threading).

### Webhook

`/api/webhooks/resend` — engagement / delivery.

### Erreurs

- Bounce / failed → job `failed`
- From domain not verified

**Statut** : EXISTANT — Post-booking / Post-payment / Nurturing channel.

---

## 5. Stripe

| | |
|--|--|
| **Rôle** | Checkout quand le prospect / client paie Hercule |
| **Auth** | Secret + publishable keys, `STRIPE_WEBHOOK_SECRET`, price IDs |
| **Lib** | `lib/legacy/payments/**` |

### Routes

`/api/payments/checkout*`, `/api/webhooks/stripe`

### Données

- Checkout session metadata → resolve lead owner
- `payments` row (amount, offer_type, phase, subscription id)

### Événements

`checkout.session.completed`, subscription lifecycle (handlers par offre).

### Erreurs

- Unknown offer_type
- Missing metadata owner
- Replay → idempotent on session id

### Limites métier

- Pas de self-checkout Stripe sur dashboard client (interdit tech-spec)
- Post-payment « prospect paie le client tiers » ≠ Stripe Hercule — **À DÉCIDER** intégration

**Statut** : EXISTANT pour paiements Hercule.

---

## 6. Outscraper

| | |
|--|--|
| **Rôle** | Scraping Google Maps / businesses |
| **Auth** | API key Outscraper (env scraper) |
| **Impl** | `lib/backend/streamlit_scraper/` |

Async jobs + poll. Taxonomy gate sur type/category/subtypes.

**Statut** : EXISTANT — module Scraping.

---

## 7. MyEmailVerifier (MEV)

| | |
|--|--|
| **Rôle** | Vérification emails bulk |
| **Auth** | `MYEMAILVERIFIER_API_KEY` |
| **Impl** | `streamlit_clean` + `shared/mev_export.py` |

CSV **single column** `email` uniquement.

**Statut** : EXISTANT — module Cleaning.

---

## 8. Groq / xAI (AI Reply)

| | |
|--|--|
| **Rôle** | Draft / auto replies Unibox |
| **Impl** | `lib/legacy/ai-reply-agent/`, Streamlit reply agent |
| **Config** | `prompt_snapshot` figé au deploy campagne |

Erreurs : unsafe / OOO / collision skips.

**Statut** : EXISTANT — sous-module Sending.

---

## 9. Render + VPS

| | |
|--|--|
| **Rôle** | Workers scrape/clean ; monitoring |
| **Artefacts** | `lib/backend/scripts/render/*`, `scripts/vps/*` |
| **Monitoring** | Prometheus / Grafana / Loki (scraper fleet) |

Filesystem éphémère Render → data sur `HERCULE_DATA_ROOT` / disque VPS.

**Statut** : EXISTANT.

---

## 10. cron-job.org

| | |
|--|--|
| **Rôle** | Déclencher `/api/cron/*` en sub-daily (Hobby Vercel) |
| **Auth** | `CRON_JOB_ORG_API_KEY` + `CRON_SECRET` Bearer sur routes |

**Statut** : EXISTANT (ops).

---

## 11. Autres

| Service | Rôle | Statut |
|---------|------|--------|
| Zoom Meeting SDK | Dépendance package — delivery calls | EXISTANT dépendance ; usage métier hors doc engine core |
| Notion | Export legal canon | EXISTANT scripts `legal:export` |
| Vercel | Host Next app | EXISTANT |

---

## Matrice module → outils

| Module | Outils principaux |
|--------|-------------------|
| Scraping | Outscraper, Instantly, VPS/Render |
| Cleaning | MEV, Instantly |
| Provisioning | Supabase, Instantly, (Calendly URLs) |
| Sending | Instantly, Groq, Supabase jobs |
| Booking | Calendly, Supabase |
| Pré-vente | Next/Supabase `funnel_pages` |
| Post-booking | Resend, Supabase jobs |
| Post-payment | Stripe, Resend, Calendly seat |
| Nurturing | Resend et/ou Instantly, Supabase |

---

## Secrets (ne jamais committer)

Voir `.env.example` : Supabase, Instantly, Calendly, Resend, Stripe, Outscraper, MEV, `CRON_SECRET`, `ADMIN_SECRET`, campaign IDs par niche.
