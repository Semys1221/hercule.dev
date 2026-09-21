# Modules universels

Chaque module = **un moteur** + **paramètres par niche**. Pas un moteur par niche.

Légende : **EXISTANT** / **À CONSTRUIRE** / **À DÉCIDER**.

---

## 1. Scraping

### A. Moteur universel (EXISTANT)

`lib/backend/streamlit_scraper/` — Outscraper Google Maps → enrichissement optionnel → SIRENE optionnel → push Instantly.

Pipeline commun à toutes les niches. Différence = fichier `configs/{preset}_config.py`.

### B. Paramètres de configuration (par niche / preset)

- Query / catégories Outscraper
- Zones géo (villes, communes INSEE, passes)
- Taxonomy gate (`TAXONOMY_INCLUDED_KEYWORDS`)
- `TARGET_LEADS`, `TARGET_MODE`
- Instantly list ID / campaign ID (écrits au bootstrap)
- Flags `ENRICH_ENABLED`, `PAPPERS_ENABLED`

### C. Données d'entrée

- Preset ID + config Python
- Clés API Outscraper / Instantly

### D. Triggers

- Manuel : Streamlit Scrape → Démarrer/Continuer (VPS worker)
- Automatique : `worker-loop` / heal cron VPS

### E. Conditions

- Dedup sur list/campaign du preset uniquement
- Taxonomy gate si activé
- Resume bloqué si fingerprint config change

### F. Actions

1. Scrape Outscraper (async poll)
2. Enrich HTML (optionnel)
3. SIRET / effectif (optionnel)
4. Push leads Instantly
5. Sidecar `mev_emails.csv` pour cleaning

### G. Sortie

- Leads dans Instantly list/campaign
- Checkpoints `scrape_state.json`, métriques, logs
- CSV MEV pour le module Cleaning

### H. États

- Worker : running / paused / incomplete (resumable)
- Preset : `onboarding_complete` ou non

### I. Erreurs / limites

- Outscraper rate limits / async timeouts
- Disconnect Instantly mid-push → resume
- Wipe local ≠ wipe Instantly

### Niches → presets (EXISTANT partiel)

| Niche | Preset(s) typiques | Statut |
|-------|-------------------|--------|
| comptable | `cabinets_expertise_comptable*`, `*_fresh_geo` | EXISTANT |
| cif | `cabinets_conseiller_financier`, `conseillers_gestion_patrimoine` | EXISTANT |
| restaurant | configs restaurants / e-commerce restos | EXISTANT (à mapper explicitement) |
| santé | dentistes, médecins, kinés… | EXISTANT comme presets ; niche unifiée À CONSTRUIRE |
| btp | `btp_pme_config` | EXISTANT |
| architect | `architectes_dplg_config` | EXISTANT scrape ; niche DB À CONSTRUIRE |

---

## 2. Cleaning

### A. Moteur universel (EXISTANT)

`lib/backend/streamlit_clean/` — export Instantly list → MyEmailVerifier → purge invalides → push valides vers campagne.

CLI headless pour Render/cron (`cli.py`).

### B. Paramètres

- Source Instantly list ID
- Target campaign ID
- Mode : dry / test_50 / full / custom
- Workspace duplicate check (toujours ON au push)

### C. Entrée

- List Instantly (emails) ou CSV single-column MEV

### D. Triggers

- Manuel Streamlit
- Cron Render (`run-clean.sh`)

### E. Conditions

- Première colonne = email (pas export Instantly UI brut)
- Crédit MEV suffisant

### F. Actions

1. Quick pre-filter
2. Bulk verify MEV
3. Optional purge list
4. Push valid → campaign
5. Checkpoint pour resume

### G. Sortie

- Campagne Instantly avec emails valides
- Fichiers checkpoint / CSV under `data/`

### H. États

- Run : in progress / completed / interrupted (checkpoint)

### I. Erreurs

- MEV API failures → retry / checkpoint
- Mauvaise CSV (colonne `id`) → rejet

---

## 3. Provisioning

### A. Moteur universel (EXISTANT)

`lib/backend/streamlit_links/` + `lib/legacy/link-tracking/` :

1. Créer row lead (slug 6-char)
2. Construire URLs réservation / confirmation
3. PATCH Instantly custom variables

### B. Paramètres (par niche)

- Table / catégorie lead (`comptable`, `cif`, …)
- Noms de variables Instantly (`reservation_comptable_link`, `reservation_cif_link`, …)
- Event type / scheduling URL Calendly (via `niche_outreach_config` ou slot client)
- **CRITIQUE :** quel lien Calendly (quel client destinataire) est injecté

### C. Entrée

- Emails / leads Instantly campaign
- Config niche + routing client (si multi-client)

### D. Triggers

- Streamlit Links → Provisioning
- Cron `/api/cron/link-provisioning`
- Webhooks Instantly `provision-*` (segments JUM legacy)

### E. Conditions

- Email unique par niche table
- Chunks 50–100 (résilience Supabase)

### F. Actions

1. Insert/upsert lead + slug
2. Write full reservation/confirmation URLs
3. Instantly REPLACE variables (+ `statut`)
4. Wipe legacy `{{link}}` / `{{confirm_link}}`

### G. Sortie

- Lead provisionné en DB
- Instantly lead avec CTA bookables

### H. États lead outreach

`NOTBOOKED` (défaut après provision)

### I. Erreurs

- Mid-batch disconnect → re-provision / Instantly-only sync
- Variable manquante dans template → send fail plus tard

### À CONSTRUIRE

- Variable Calendly **universelle** (pas `reservation_{niche}_link` fragmenté) OR convention unique documentée
- Provisioning multi-client : injecter l'event type du client routé, pas seulement un lien niche fixe

---

## 4. Sending

### A. Moteur universel (EXISTANT)

Deux couches :

1. **Cold Instantly** — séquence campagne (hors Next)
2. **Bypass Subsequence** — `lib/legacy/instantly-bypass/` : Interested → Unibox E1–E3
3. **AI Reply Agent** — `lib/legacy/ai-reply-agent/` : réponses inbound (Groq)

### B. Paramètres

- `instantly_bypass_config` (campaign_id, auto-send, pipeline advance)
- Templates E1–E3 (`instantly_bypass_templates`) — copy par niche/campagne
- Send window manuel : lun–ven 8–17 Paris
- Prompt snapshot AI reply (`ai_reply_agent_config`)
- Kill-switch global `instantly_bypass_settings` / `ai_reply_agent_settings`

### C. Entrée

- Lead Instantly Interested / reply webhook
- Variables provisionnées (dont lien Calendly)

### D. Triggers

- Instantly `lead_interested` → `/api/webhooks/instantly`
- Instantly reply → `/api/webhooks/instantly/reply`
- Crons : `instantly-bypass-jobs`, `instantly-bypass-pipeline`, `ai-reply-agent-*`

### E. Conditions

- Campaign initialized + auto-send enabled
- E1 thread guard (pas de double E1)
- Send window pour envois manuels
- Blocklist / unsafe skip pour AI

### F. Actions

- Schedule / send Unibox reply
- Advance pipeline step_0 → step_3
- AI draft + auto/manual send
- Sync Instantly interest status

### G. Sortie

- Emails dans thread Unibox
- Rows `instantly_bypass_events` / `jobs` / `pipeline`
- Lead prêt à booker (lien dans E1–E3)

### H. États

Pipeline : `step_0` | `step_1` | `step_2` | `step_3` | `replies_to_handle`  
Jobs : `pending` | `sent` | `cancelled` | `failed`

### I. Erreurs

- LEG-02 : ne pas double-send Next + Streamlit
- Transient Instantly errors → retry
- Collision / OOO → skip statuses AI

---

## 5. Booking

### A. Moteur universel (EXISTANT partiel)

1. Prospect clique lien provisionné → page Calendly (HTML/React slug)
2. Book dans org Calendly Hercule (event type du **client destinataire**)
3. Webhook `invitee.created` → `/api/webhooks/calendly` → `book-lead` → statut `MEETING_BOOKED`
4. Cancel → `invitee.canceled` → reset + cancel jobs

### B. Paramètres

- Event type URI par client (EXISTANT partiel via `client_outreach_slots.calendly_scheduling_url` / `niche_outreach_config`)
- Slug / `utm_content` pour retrouver le lead
- `BOOKING_GO_LIVE_AT` (legacy agence cutoff — DEPRECATED pour nouvelles niches)

### C. Entrée

- Payload Calendly (invitee, event, utm_content)
- Lead row existante

### D. Triggers

- Webhook Calendly
- Confirm page → `/api/link-tracking/confirm` → `CONFIRMED`
- Click tracking → `/api/link-tracking/click` → `CLICKED`

### E. Conditions

- Slug match lead
- Signatures webhook valides

### F. Actions

- Update lead (booked_at, calendly_*, first_name, company)
- Sync Instantly statut
- Upsert `sales_calls` (si applicable)
- Start post-booking jobs (si module ON)

### G. Sortie

- Lead `MEETING_BOOKED`
- Jobs email éventuels
- RDV dans calendrier du client connecté

### H. États

`NOTBOOKED` → `CLICKED` → `MEETING_BOOKED` → `CONFIRMED` | `CANCELLED`

### I. Erreurs

- Booking untracked (pas de slug) → role recovery sequence (EXISTANT agence)
- Signature invalide → 401
- Calendly **pas de no-show webhook fiable** — action humaine (ORCH-01)

### À CONSTRUIRE

- Routing multi-client : sélection event type par règles (quota, round-robin, capacité) — voir [`routing.md`](./routing.md)
- Event type **par client** (confirmé métier) partout, pas seulement niche fixe

---

## 6. Pré-vente

### A. Moteur universel (EXISTANT fragmenté — À CONSOLIDER)

Expérience **automatique** après booking (sans commercial live). Même module, deux configs :

1. Page présentation (photo, texte, contexte)
2. Wizard questions

Fragments existants : `funnel_pages`, `content/funnels/**`, HTML `public/reservation*.html`, sales session (live) hors scope pré-vente auto.

### B. Paramètres

- Type : `presentation` | `wizard`
- Contenu (copy, assets, questions)
- Slug / client ID pour personnalisation
- Audience / niche

### C. Entrée

- Lead booké (slug, email, niche, client destinataire)

### D. Triggers

- Redirect / lien post-booking immédiat
- Ou page liée dans email immediate

### E. Conditions

- Module toujours ON (obligatoire)
- Lead authentifié par slug (pas de login)

### F. Actions

- Afficher contenu config
- Persister réponses wizard → `profile` JSONB (EXISTANT pattern)
- Qualifier pour post-payment / nurturing

### G. Sortie

- Lead enrichi (profile)
- Prêt pour modules optionnels

### H. États

Pas d'enum dédié pré-vente aujourd'hui.  
À DÉCIDER : `presale_completed_at` / statut dédié.

### I. Erreurs

- Slug invalide
- Contenu non publié (`funnel_pages.status`)

### À CONSTRUIRE

- Module unique configurable (pas fragments sales-session + HTML + funnel CMS)
- Binding explicite niche → config pré-vente

---

## 7. Post-booking (optionnel)

### A. Moteur universel (EXISTANT)

`lib/legacy/booking-communication/` :

Webhook book → `booking_email_jobs` → cron `/api/cron/booking-emails` → Resend.

Types typiques : `immediate`, `h48_confirm`, `h24_relance`, `h20_cancel`, role recovery.

### B. Paramètres

- ON / OFF par niche (**À DÉCIDER** : où stocker le flag — `niche_outreach_config` ?)
- Templates par category × email_type
- Timing (H-48, H-24, H-20) — EXISTANT hardcodé dans schedule
- Confirm URL

### C. Entrée

- Lead `MEETING_BOOKED` + scheduled_at

### D. Triggers

- Calendly book (si ON)
- Confirm / cancel
- Cron 15 min

### E. Conditions

- Module ON
- Jobs pending, send window Resend
- Confirm annule `h24_relance`

### F. Actions

- Enqueue jobs idempotents
- Send Resend + threading
- Cancel pending on confirm/cancel

### G. Sortie

- Emails transactionnels
- Lead `CONFIRMED` ou `CANCELLED`

### H. États jobs

`pending` | `sent` | `cancelled` | `failed`

### I. Erreurs

- Idempotency key unique
- Resend failures → failed + retry manuel
- No-show : admin/client report (pas webhook Calendly)

---

## 8. Post-payment (optionnel)

### A. Moteur universel (EXISTANT partiel)

Stripe webhook → `payments` + transitions product + emails (`product_payment_welcome`, onboarding sequences, calendly seat).

**Métier :** le paiement déclencheur peut être :

- prospect → paie Hercule (Stripe) — EXISTANT
- prospect → paie le client destinataire (signal externe) — **À DÉCIDER** mécanisme

Configurable par niche.

### B. Paramètres

- ON / OFF
- Offer types / price IDs
- Timing onboarding (J0, J1, reminders) — EXISTANT dans templates
- Calendly seat invite flow (EXISTANT pour agence)

### C. Entrée

- Stripe `checkout.session.completed` / subscription events
- Ou signal externe (À DÉCIDER)

### D. Triggers

- `/api/webhooks/stripe`
- Crons onboarding / calendly-seat-check

### E. Conditions

- Module ON
- Payment succeeded, owner lead résolu
- Idempotence session Stripe

### F. Actions

- Upsert `payments`
- Transition product_statut (si applicable)
- Start onboarding emails
- Calendly org invite (si client Hercule)
- Cancel close-indecis / nurture conflit

### G. Sortie

- Payment row
- Client potentiel import CRM Hercule (À CONSTRUIRE)
- Seat onboarding status

### H. États

`payments` + `product_statut` (legacy) + `calendly_seat_onboarding.status`

### I. Erreurs

- Webhook secret invalide
- Offer type inconnu
- Double checkout

---

## 9. Nurturing (optionnel)

### A. Moteur universel (EXISTANT fragmenté — À UNIFIER)

Séquences séparées aujourd'hui :

- `no-show-sequence`
- `upsell-sequence`
- `close-indecis-sequence`
- `free-trial-sequence` / `free-trial-started-sequence`

Canon : **un** moteur nurturing, conditions + timing + templates par niche.

### B. Paramètres

- ON / OFF (indépendant de Post-booking)
- Conditions : acheté / non acheté / no-show / échéance / réactivation
- Timing J+n (**À DÉCIDER** : config DB vs hardcode)
- Channel : Resend et/ou Instantly

### C. Entrée

- Lead + états (booked, paid, no-show, sales_call status)

### D. Triggers

- Admin workflow action
- Cron sequence-scheduler / management-recipients
- Stripe / appointment complete / no-show

### E. Conditions

- Module ON
- Matching condition set
- Pas d'opt-out / stop-all

### F. Actions

- Enqueue emails
- Advance recipient state
- Stop on conversion / opt-out

### G. Sortie

- Jobs / recipients updated
- Lead réactivé ou archivé

### H. États

`email_sequence_recipients` + sales_call statuses (`not_paid`, `no_show`, `lost`, …)

### I. Erreurs

- Double nurture vs post-payment → cancel rules (EXISTANT partiel)
- Timing incorrect → À DÉCIDER table config

---

## Matrice récapitulative

| Module | Moteur unique | Config niche | Multi-client | Statut global |
|--------|---------------|--------------|--------------|---------------|
| Scraping | ✓ | presets | N/A | EXISTANT |
| Cleaning | ✓ | list/campaign | N/A | EXISTANT |
| Provisioning | ✓ | vars + Calendly URL | À CONSTRUIRE | EXISTANT partiel |
| Sending | ✓ | templates/prompts | N/A | EXISTANT |
| Booking | ✓ | event types | À CONSTRUIRE | EXISTANT partiel |
| Pré-vente | ✓ (cible) | page/wizard | contenu client | EXISTANT fragmenté |
| Post-booking | ✓ | ON/OFF + templates | N/A | EXISTANT |
| Post-payment | ✓ | ON/OFF + offers | N/A | EXISTANT partiel |
| Nurturing | À unifier | ON/OFF + conditions | N/A | EXISTANT fragmenté |
