# 03 — Base de données

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


**17 tables migrées.** Aucune table `matches`. Aucun `CREATE POLICY` (RLS on = deny anon). Types TS **manuels**, pas de `database.types.ts` généré.

Légende colonnes : **A** autoritaire · **D** dérivé · **L** legacy · **T** temporaire · **W** déclenche workflow · **U** UI · **I** interne.

---

## PARTIE 1 — Ce qui est valide

- Un projet Supabase ; écritures via **service role** serveur / Streamlit / scripts.
- Tables leads **miroir** `agence` / `entreprise` : intention produit claire (V-06) — à **garder** tant que FND ne fusionne pas les audiences.
- `booking_email_jobs.idempotency_key` UNIQUE + index pending unique `(lead_id, email_type)` où pending.
- `profile` JSONB + `ONBOARDED` existent ([migration onboarding](../../supabase/migrations/20260924120000_onboarding_profile.sql)) ; `buildDefaultProfile()` aligne la spec délais.
- `agence_demandes` SoT du carousel homepage.
- Domaines Instantly bypass et AI reply **isolés** (tables dédiées), pas mélangés dans `profile`.
- Triggers `updated_at` sur `agence`, `entreprise`, `agence_demandes` seulement.
- **Pas** de table `communications` (`ENG-01`).

---

## PARTIE 2 — Écarts

1. **Enum produit absent** — `IN_DELIVERANCE`, `MATCH_PROPOSED`, `POST_RDV_SURVEY`, `SOLD` non migrés. → [FND-01](./01-foundations-validation.md)
2. **`matches` / `matched_*` / `deliverance_*` documentés, absents.** → FND-05
3. **Un RDV par lead** vs N livraisons. → [SOT-01](./16-sources-and-events-validation.md)
4. **`lead_id` jobs sans FK** — volontaire (`ENG-08`).
5. **URLs dénormalisées** + colonne générée `link` = `slug` — copies ; slug est autoritaire.
6. **Registry interne incomplet** vs 17 tables (il liste les principales, status `matches: planned`).
7. **`BOOKED` encore dans l’enum** — `ENG-14`.

#### [DB-01] Faut-il étendre le même enum `lead_statut` avec les valeurs produit, ou séparer « état CRM » et « état produit » ?

Mélanger `CLICKED` et `IN_DELIVERANCE` sur une colonne unique rend les filtres admin et les webhooks Calendly ambigus.

- [x] **A (recommandé)** — Deux champs : `statut` CRM (existant) + `product_statut` (ou équivalent) pour le parcours payant / délivrance.
- [ ] **B** — Un seul enum étendu (ajouter les valeurs tech-stack / MEETING_n sur `lead_statut` actuel).
- [ ] **C** — Tables séparées (lead CRM vs client produit) liées par email.

**Impact si l’architecture change :** High  
**Domaines affectés :** Toutes les lectures de `statut`, Instantly sync, admin  
**Ancien ID :** V-08

#### [DB-02] Le JSON `profile` reste-t-il le contrat central des délais, timeline, survey et offres (pas 20 colonnes SQL) ?

C’est l’intention V-11 ; le CRM n’utilise presque pas `profile` hors onboarding admin.

- [x] **A (recommandé)** — Oui : `profile` = config / UI / offres ; colonnes SQL = identité, CRM Calendly, FKs, compteurs dérivés si SOT-01 = A.
- [ ] **B** — Réduire `profile` ; normaliser survey / offers / capacity en colonnes ou tables.
- [ ] **C** — `profile` seulement pour le formulaire ; le reste en tables dédiées.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Onboarding, emails, survey, capacity  
**Ancien ID :** V-11, V-12, V-13, V-14

---

## Inventaire des tables

Statut : **active** / **planned** / **questionable**.

### `agence` — active — CRM + amorce produit

| | |
|--|--|
| **Purpose** | Fiche agence (acquisition Instantly/Calendly + onboarding admin) |
| **PK** | `id` UUID |
| **FK** | aucune |
| **Indexes** | unique `lower(trim(email))`, unique `slug`, `statut`, unsynced calendly links |
| **RLS** | enabled, 0 policy |
| **Writers** | webhook Calendly, APIs link-tracking, admin onboarding, Streamlit, scripts |
| **SoT** | identité, statut CRM, Calendly courant, profile |
| **Problèmes** | overlay produit manquant ; 1 meeting ; URLs dénorm |
| **Action reco** | garder ; étendre selon FND-01 / SOT-01 |

Colonnes (miroir `entreprise` sauf usage confirm_link) :

| Colonne | Type | Null | Default | Rôle |
|---------|------|------|---------|------|
| id | UUID | no | gen | A PK |
| email | TEXT | no | | A |
| statut | lead_statut | no | NOTBOOKED | A CRM ; W |
| slug | TEXT | no | | A tracking |
| link | TEXT generated | | = slug | L alias |
| reservation_agence_link | TEXT | no | | D URL |
| reservation_entreprise_link | TEXT | no | | D |
| confirmation_agence_link | TEXT | no | | D |
| instantly_lead_id | TEXT | yes | | A externe |
| instantly_campaign_id | TEXT | yes | | A externe |
| calendly_invitee_uri | TEXT | yes | | A externe |
| calendly_join_url | TEXT | yes | | D Calendly |
| calendly_reschedule_url | TEXT | yes | | D |
| calendly_cancel_url | TEXT | yes | | D |
| calendly_links_synced_at | TIMESTAMPTZ | yes | | I |
| calendly_links_sync_error | TEXT | yes | | T |
| booked_at | TIMESTAMPTZ | yes | | A |
| instantly_synced_at | TIMESTAMPTZ | yes | | I |
| first_name | TEXT | yes | | A (Calendly ou admin) |
| company | TEXT | yes | | A |
| calendly_payload | JSONB | yes | | I snapshot |
| calendly_questions | JSONB | yes | `{}` | A réponses |
| scheduled_at | TIMESTAMPTZ | yes | | A W jobs |
| confirmed_at | TIMESTAMPTZ | yes | | A |
| instantly_confirmed_synced_at | TIMESTAMPTZ | yes | | I |
| onboarding_completed_at | TIMESTAMPTZ | yes | | A produit |
| profile | JSONB | no | `{}` | A produit (souvent vide) |
| created_at / updated_at | TIMESTAMPTZ | no | now | I |

**Absents vs doc :** `matched_entreprise_id`, `deliverance_step`, `deliverance_total_steps`, `deliverance_started_at`, `estimated_completion_at`.

### `entreprise` — active — miroir

Même schéma. Unique email / slug. Confirm link stocké mais emails confirm = parcours agence.

### `matches` — planned — **pas migrée**

Spec : `agence_id`, `entreprise_id`, `matched_at`, `created_by`, `notes`. Action : créer seulement si FND-05 ≠ B.

### `booking_email_jobs` — active — communication

| Colonne | Rôle |
|---------|------|
| id | PK |
| lead_category | agence\|entreprise |
| lead_id | UUID **sans FK** |
| email_type | CHECK types booking |
| scheduled_for | A quand |
| status | pending/sent/cancelled/failed |
| resend_email_id / resend_message_id | D Resend |
| thread_subject, use_html | I threading |
| idempotency_key | A UNIQUE |
| triggered_by | calendly/manual/retry/role_recovery |
| sent_at, opened_at, clicked_at, delivered_at | A/D engagement |
| cancelled_at, error_message | I |
| created_at | I |

Used by : orchestrator, cron, Resend webhook, Streamlit booking_resend, scripts repair.

### `booking_email_templates` — active

PK `(category, email_type)`. `subject`, `body`, `updated_at`. SoT du **corps** booking.

### `agence_demandes` — active — marketing

Voir migration. `origine` ajoutée plus tard. Writers : admin API + Streamlit demands. Readers : homepage.

### Instantly bypass (6 tables) — active — ops

| Table | PK / unique | Purpose |
|-------|-------------|---------|
| instantly_bypass_templates | campaign_id + template_key | Copy E1–E3 / no-show |
| instantly_bypass_config | campaign_id | subsequence IDs, toggles |
| instantly_bypass_events | idempotency_key | audit webhook |
| instantly_bypass_jobs | idempotency_key | queue hors fenêtre |
| instantly_bypass_pipeline | (campaign_id, lead_email) | step_0…step_4 |
| instantly_bypass_settings | id=1 singleton | kill switch webhook |

### AI reply (6 tables) — active — ops

| Table | Notes |
|-------|-------|
| ai_reply_agent_settings | kill switch |
| ai_reply_agent_config | campaign → prompt niche, max_sentences |
| ai_reply_agent_messages | inbound/outbound, ai_status, thread_json, cost ticks |
| ai_reply_agent_jobs | **FK** message_id → messages |
| ai_reply_agent_leads | UNIQUE (campaign_id, lead_email), draft overwrite |
| ai_reply_agent_blocklist | UNIQUE (campaign_id, lead_email) |

---

## Enum `lead_statut` réel

`NOTBOOKED` | `BOOKED` (legacy) | `CLICKED` | `MEETING_BOOKED` | `CONFIRMED` | `CANCELLED` | `ONBOARDED`

`MEETING_BOOKED` / `CONFIRMED` ajoutés via script Management API (limitation Postgres enum dans un seul fichier SQL).

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| DB-01 | A | statut CRM + product_statut |
| DB-02 | A | profile JSON config/UI/offres |
