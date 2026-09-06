# 16 — Sources de vérité et événements métier

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Ne pas mélanger : **configuration**, **exécution**, **événement**, **vue dérivée**.

---

## PARTIE 1 — Ce qui est valide

| Fait | Source autoritaire **actuelle** (code) | Copies dérivées | Sync |
|------|----------------------------------------|-----------------|------|
| Identité lead (email, nom, société) | Colonnes `agence` / `entreprise` | Instantly custom vars | Push Instantly au book/confirm |
| Statut acquisition CRM | Colonne `statut` | Instantly interest | `syncLeadStatutToInstantly` |
| Slug tracking | Colonne `slug` (`link` généré = alias) | URLs stockées `reservation_*` | Dénormalisé ; recalculable (`ENG` : garder URLs pour Instantly) |
| RDV Calendly (1 par lead) | Colonnes `calendly_*`, `scheduled_at`, `booked_at` | `calendly_payload` JSONB | Webhook + cron retry liens |
| Queue email booking | `booking_email_jobs` | Engagement Resend sur la même row | Webhook Resend |
| Corps email booking | `booking_email_templates` | Seeds SQL historiques | Streamlit + API templates |
| Bypass Instantly étape | `instantly_bypass_pipeline` | events / jobs | Webhook + crons |
| Kill switch bypass | `instantly_bypass_settings` | — | Streamlit |
| AI reply | `ai_reply_agent_*` | Instantly Unibox | Webhook reply + cron |
| Carousel homepage | `agence_demandes` | — | Admin + Streamlit demands |
| Funnel sales JSON | Fichiers `content/funnels/**/funnel.json` | — | `/api/admin/funnels` |
| FAQ / pricing / légal site | Fichiers `content/` + `doc/tech-stack` | Pages Next | Éditeurs internal |
| Stats campagnes Instantly | Instantly API (live) | `app/streamlit_stats/campaign_stats.json` | Fetch manuel |
| Profile onboarding | `profile` JSONB (souvent `{}` hors admin fiche) | — | `POST /api/admin/onboarding` |
| CGV / tarifs légaux | `doc/tech-stack/cvg_master.md` | Landing copy | Audit `cvg_site-sync.md` |

**Valide :** pas de table `communications` ; jobs + templates + profile. (`ENG-01`)

---

## PARTIE 2 — Trous et conflits de SoT

### Profils

| Fiche | SoT code | SoT docs | Problème |
|-------|----------|----------|----------|
| Agence | Row `agence` + `profile` | Idem + matching FKs absents | `profile` est un contrat **vide par défaut** sauf onboarding admin |
| Entreprise | Row `entreprise` | Dashboard entreprise selon spec | Pas de portail |

### Rendez-vous

Le CRM suppose **un** invitee Calendly par lead. La délivrance suppose **N** RDV honorés et un compteur. Réutiliser `calendly_invitee_uri` pour le matching **écrase** le RDV d’acquisition.

#### [SOT-01] Le cycle de vie des rendez-vous de délivrance (compteur, association entreprise, no-show) doit-il avoir une entité dédiée, distincte du RDV Calendly d’acquisition stocké sur le lead ?

Aujourd’hui un lead n’a qu’un jeu de colonnes Calendly ; `documentations_2` exige un historique et `MEETING_n`. Inventer `appointments` sans votre feu vert serait un nouveau produit.

- [x] **A (recommandé)** — Oui : table (ou équivalent) `appointments` / livraisons, **séparée** des colonnes Calendly d’acquisition ; le compteur et les statuts `MEETING_n` se **dérivent** de ces records, ils ne sont pas tapés dans l’UI.
- [ ] **B** — Non : garder un seul RDV par lead (colonnes actuelles) ; pas de compteur `MEETING_n`.
- [ ] **C** — Historique dans `profile` JSON / JSONB, sans table SQL.

**Impact si l’architecture change :** High  
**Domaines affectés :** Database, Calendly, dashboard, Resend, tracking agence  
**Conflit :** CF-06

### Autres faits sans SoT unique

| Fait | Candidats | Question |
|------|-----------|----------|
| Config séquence email produit (délais délivrance) | `profile.communication.delays` (spec) vs constantes booking (code) | [EML-01](./08-email-sequences-validation.md) |
| Statut paiement | Nulle part en code ; admin `payment-confirmed` spec | [INT-01](./11-integrations-validation.md) |
| Stats outreach | Instantly vs JSON local | [SOT-02](./16-sources-and-events-validation.md#sot-02) |
| Funnel sales | Filesystem déjà SoT | [FUN-01](./07-funnels-validation.md) — confirmer |
| Copy reusable | CGV, `emails/`, SQL seeds, `doc/email_outreach_copy/` | [CPY-01](./09-copywriting-validation.md) |

#### [SOT-02] Quelle est la source de vérité des statistiques de campagnes Instantly affichées en interne ?

`documentations_2/sequence_email.md` oppose Instantly live et JSON local (`streamlit_stats`).

- [ ] **A (recommandé)** — Instantly API = vérité live ; cache local optionnel avec refresh manuel ; ne pas traiter le JSON comme métier.
- [ ] **B** — Garder le JSON local comme archive / snapshot ops sans obligation de sync.
- [x] **C** — Persister les stats en Supabase (nouvelle table) comme vérité interne.

**Impact si l’architecture change :** Low–Medium  
**Domaines affectés :** Internal dashboard, Instantly, Streamlit stats

---

## Événements métier (inventaire)

Légende type : **implémenté** / **spec uniquement**.

Chaque événement live a : owner, source, effet DB, idempotence, échec.

### Acquisition CRM (implémenté)

| Événement | Trigger | Validation | Règle | Mutation | Statut | Downstream | Email | UI |
|-----------|---------|------------|-------|----------|--------|------------|-------|-----|
| Lien cliqué | `GET /api/link-tracking/click` | slug | NOTBOOKED→CLICKED | `statut` | CLICKED | — | — | Redirect Calendly |
| RDV créé | Webhook Calendly `invitee.created` | signature, utm slug | book lead | calendly_*, scheduled_at | MEETING_BOOKED | Instantly sync, enqueue jobs | séquence booking | Streamlit |
| RDV annulé | `invitee.canceled` | email trouvé | cancel | CANCELLED | CANCELLED | cancel jobs, Instantly | stop follow-ups | Streamlit |
| Confirm présence | `GET/POST link-tracking/confirm` | slug+email | CONFIRMED | confirmed_at | CONFIRMED | Instantly, cancel h24 | — | HTML confirm |
| Job email due | Cron booking | CRON_SECRET | send window Paris | job sent/failed | — | Resend | email | — |
| Engagement email | Webhook Resend | Svix | earliest timestamp | opened/clicked/delivered | — | — | — | Streamlit |
| Lead interested | Webhook Instantly | bearer | bypass E1 | events/pipeline/jobs | — | Instantly reply | E1 | Streamlit |
| Reply inbound | Webhook Instantly reply | bearer | AI agent | messages | — | Grok / Instantly reply | — | Streamlit |
| Pipeline due | Cron bypass pipeline | secret | E2/E3/close | step | — | Instantly | E2/E3 | — |
| Onboarding admin | POST admin onboarding | Zod | insert | row + profile | ONBOARDED | URLs | **pas** de job `onboarding_confirm` dans le code | internal |

**Idempotence live :** jobs `idempotency_key` ; bypass events key ; re-book même invitee = already updated ; confirm/cancel déjà CONFIRMED/CANCELLED = no-op.

**Échec live :** Resend fail → job `failed` (pas de retry auto) ; Instantly 429 → retry 5× ; sync Instantly fail loggé, cron/webhook retry partiel ; Grok fail → message `failed`.

### Produit spec (non implémenté) — owner à confirmer via FND / ORCH

| Événement | Trigger spec | DB spec | Email spec |
|-----------|--------------|---------|------------|
| Onboarding client | POST public | ONBOARDED | `onboarding_confirm` NOW |
| Promote délivrance | Admin | IN_DELIVERANCE | search_started, d7, milestones |
| Mettre en lien | Admin | matches + MATCH_PROPOSED | Calendly entreprise |
| Fin RDV | Calendly ended | POST_RDV_SURVEY | survey tokens |
| Survey agence/entreprise | POST token | SOLD / IN_DELIVERANCE | nurture / j7 |
| Paiement 1489/898 | Admin | nouveau cycle ONBOARDED | cancel nurture |
| No-show | Client 48h / admin | recréditer attribution | — |
| MEETING_10 | compteur | upsell | — |
| Sale reported | survey sale_made | SOLD | — |
| Workflow completed | — | COMPLETED | — |

#### [SOT-03] Les délais et variables des emails **produit** (délivrance, matching, post-RDV) vivent-ils dans `profile.communication.delays` par fiche, comme la spec ?

Le CRM booking utilise aujourd’hui des offsets **code** (h48/h24/h20) + templates DB, pas `profile.delays`.

- [x] **A (recommandé)** — Oui pour les séquences **produit** ; le booking CRM garde ses offsets code (deux familles, deux SoT assumées).
- [ ] **B** — Tout rester en code + `booking_email_templates` ; `profile.delays` n’est pas nécessaire.
- [ ] **C** — Une table de config globale (settings) pour les délais produit, pas du JSON par fiche.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** profile JSON, emails, admin  
**Ancien ID :** V-11, V-20, V-21

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| SOT-01 | A | Table appointments ; compteur dérivé |
| SOT-02 | C | Stats Instantly en base |
| SOT-03 | A | Délais produit dans profile ; vente en code |
