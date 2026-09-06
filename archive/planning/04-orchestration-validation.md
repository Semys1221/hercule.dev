# 04 — Orchestration

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Pas de Temporal / n8n / Inngest / Server Actions. **Moteur = webhook → mutation DB → insert job → cron drain.**

Ne pas confondre : webhook, cron, job, workflow métier, séquence email.

---

## PARTIE 1 — Ce qui est valide

| Processus | Type | Pourquoi le garder |
|-----------|------|-------------------|
| Séquence booking Resend | webhook Calendly + cron 15 min | Live, idempotent, fenêtre Paris |
| Drain bypass Instantly | cron 10 min | Envois hors horaires |
| Avance pipeline E2/E3/close | cron | État `instantly_bypass_pipeline` |
| AI reply jobs manuels | cron | File différée Streamlit |
| Retry liens Calendly | inclus cron booking | `calendly_links_sync_error` |
| Cancel follow-ups à l’annulation | synchrone webhook | Cohérent |

Durées : jobs = minutes à 48 h (h48) ; h20 cancel agence seulement. Concurrence : un cron-job.org ; pas de lock distribué — acceptable à ce volume (`ENG`).

---

## PARTIE 2 — Trous

- Fin de RDV / no-show **non orchestrés** (CF-12).
- Emails produit (délivrance, matching, nurture, onboarding_confirm) **non enqueue**.
- Promote / matching / payment-confirmed **pas de workflows**.
- Job Resend `failed` : **pas de retry auto** (`ENG` : retry doit être une action admin ou un cron dédié — produit décide si on expose un bouton, pas le mécanisme).

#### [ORCH-01] Comment un RDV matché passe-t-il en survey / no-show : webhook Calendly « fin d’événement », déclaration client (CGV 48 h), ou bouton admin ?

Le webhook ignore tout sauf `invitee.created` / `invitee.canceled`. La spec matching veut un event ended ; la CGV veut un signalement humain.

- [x] **A (recommandé)** — Admin (ou client via parcours dédié) marque réalisé / no-show ; Calendly `canceled` reste le seul webhook d’annulation. Pas de dépendance à `event.ended` (Calendly ne le fournit pas de façon fiable pour ce flux).
- [ ] **B** — Préserver l’actuel : rien après book/cancel/confirm ; pas de survey auto.
- [ ] **C** — Brancher d’autres events Calendly (ou un cron « RDV dans le passé ») pour basculer automatiquement `POST_RDV_SURVEY` / recréditer no-show.

**Impact si l’architecture change :** High  
**Domaines affectés :** Calendly, statuts, emails, CGV  
**Ancien ID :** V-32, CF-12  
**Lié :** [ADM-03](./19-internal-admin-validation.md) (où l’opérateur clique — ne remplace pas ORCH-01)

#### [ORCH-02] Les emails booking CRM (h48/h24/h20) restent-ils le seul workflow auto post-Calendly d’acquisition ?

C’est le comportement **actuel**. Les emails « recherche lancée » sont une autre famille (FND-04).

- [x] **A (recommandé)** — Oui : ne pas fusionner booking acquisition et emails délivrance ; deux orchestrateurs, deux types de jobs (réutiliser la table jobs avec de nouveaux `email_type` si FND-04 = A).
- [ ] **B** — Remplacer / éteindre la séquence booking une fois le produit délivrance live.
- [ ] **C** — Un seul moteur de séquence générique (builder UI) dès le MVP.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Resend, templates, Streamlit booking  
**Ancien ID :** V-09, V-19

#### [ORCH-03] Un paiement / upsell confirmé doit-il **annuler** les jobs de nurturing de façon synchrone dans la même requête admin ?

Spec : `payment-confirmed` coupe les emails 60 j. Le code n’a pas cette route.

- [x] **A (recommandé)** — Oui : même transaction/request que le PATCH paiement : cancel jobs + statut ; pas de cron « réconcilie paiement ».
- [ ] **B** — Pas de nurturing au MVP (alors pas d’orchestration).
- [ ] **C** — Event asynchrone (job) pour cancel, au risque d’un email après paiement.

**Impact si l’architecture change :** Medium  
**Domaines affectés :** Post-RDV, jobs  
**Ancien ID :** V-37

---

## Inventaire des jobs / workflows

### 1. Booking email sequence

| Champ | Valeur |
|-------|--------|
| **Type** | Workflow (jobs) + cron |
| **Trigger** | Calendly created / manual Streamlit / role_recovery |
| **Entry** | `startSequence` dans orchestrator |
| **Fréquence cron** | */15 cron-job.org |
| **Durée** | immediate → h48 → h24 ; agence + h20 cancel |
| **Services** | Supabase, Resend, Calendly (h20 cancel event) |
| **Reads** | lead, jobs, templates |
| **Writes** | jobs status, parfois cancel Calendly |
| **Retries** | send fail → `failed` ; pas de replay auto ; `triggered_by=retry` existe pour manuel |
| **Timeouts** | timeout fonction Vercel |
| **Idempotency** | `idempotency_key` ; pending unique |
| **Concurrency** | un drainer |
| **Logging** | console.error |
| **User-facing** | emails lead |
| **Sync vs async** | enqueue sync ; send async cron ; fenêtre Paris peut **reschedule** |

Types : `immediate`, `h48_confirm`, `h24_relance`, `h20_cancel` (agence), `role_seq_48`, `role_seq_24`.

Entreprise : **pas** de h20.

### 2. Instantly bypass subsequence

| | |
|--|--|
| **Type** | Webhook + jobs + 2 crons |
| **Trigger** | `lead_interested` |
| **Steps** | E1 → E2 +24h → E3 +48h → close interest −1 |
| **Idempotency** | events.idempotency_key |
| **Échec** | ACK 200 sur skips métier ; 500 si vrai échec |
| **Overlap** | Streamlit subsequence (CF-11) |

### 3. AI reply agent

| | |
|--|--|
| **Type** | Webhook Instantly reply + Grok + cron jobs manuels |
| **Idempotency** | instantly_email_id ; collision guard |
| **User-facing** | replies dans Unibox Instantly |

### 4. Link tracking confirm / click

**Type :** API synchrone (pas un job). Click et confirm mutent le lead immédiatement.

### 5. Spec non implémenté

Promote, matching link, survey tokens, nurture 60 j, onboarding_confirm, milestone délivrance, payment-confirmed — **workflows métier documentés, 0 entrypoint**.

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| ORCH-01 | A | Fin RDV / no-show = acte admin ou client |
| ORCH-02 | A | Deux familles email, même moteur |
| ORCH-03 | A | Stop nurturing immédiat au paiement |
