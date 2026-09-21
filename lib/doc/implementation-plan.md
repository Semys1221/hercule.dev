# Implementation plan

Plan de construction **backend** (moteur, puis gestion). Spec d’écrans produit : **après** la Phase 7 conceptuelle.  
Respecte le pattern `webhook → job → cron`. Pas d'Inngest/n8n.

**Plan exécutable pour un agent :** [`build/KICKOFF.md`](./build/KICKOFF.md) + [`build/AGENT-PROMPT.md`](./build/AGENT-PROMPT.md)  
(Phase **-1** archive+wipe local sans deploy, puis inventaire **archive** + Notion, puis `build/phases/00` … `15`, décisions [`build/decisions.md`](./build/decisions.md) D1–D22).

Ce fichier reste le plan **conceptuel**. En cas d’écart, le chantier `build/` + `decisions.md` prime pour l’implémentation.

Chaque phase ci-dessous : objectif, composants, dépendances, fichiers, critères de validation, risques.

---

## Phase 0 — Alignement doc & freeze deprecated (prérequis)

**Objectif :** figer le modèle mental ; empêcher d'étendre le legacy buyer/seller.

**Composants :**

- Marquer dans registry / comments : `agence`, `entreprise`, `jum`, `matches` = DEPRECATED
- Mettre à jour skills/refs path `lib/legacy/**` (hors scope si pure doc — déjà documenté ici)

**Dépendances :** aucune.

**Fichiers :** `lib/doc/*` (cette doc), éventuellement `lib/legacy/admin/architecture/*-registry.ts` notes.

**Validation :** un nouveau dev lit `architecture.md` et cite les 6 niches actives sans buyer/seller.

**Risques :** confusion code legacy encore live (agence campaigns) — documenter « live mais hors canon ».

---

## Phase 1 — Data model niches actives

**Objectif :** config et tables alignées sur `comptable`, `cif`, `restaurant`, `santé`, `btp`, `architect`.

**Composants :**

1. Migration `niche_outreach_config` CHECK → niches actives ; geler anciennes
2. Étendre `prospect_pool.niche` → `architect`
3. Décider table lead `architect` (mirror `cif`) **ou** pool-only — **À DÉCIDER** puis implémenter
4. Flags optionnels PB/PP/Nur sur config niche (**À DÉCIDER** colonnes)

**Dépendances :** Phase 0.

**Fichiers :**

- `lib/backend/supabase/migrations/YYYYMMDD_niche_canon.sql`
- `lib/backend/scripts/crm/apply*.ts`
- `lib/legacy/link-tracking/types.ts` (LeadCategory)
- `lib/legacy/admin/niches/outreach-config.ts`

**Validation :**

- Seed config 6 niches
- Types TS compilent sans `jum`/`agence` comme niches actives (aliases legacy OK)

**Risques :** cascades FK `sales_calls` / payments encore liées `agence`/`jum` — migration soft (nullable + stop writes).

---

## Phase 2 — Provisioning universel + variable Calendly client

**Objectif :** un moteur de provision qui injecte le **lien du client routé**, pas un lien niche fixe.

**Composants :**

1. API/lib `provisionLead({ niche, email, clientSlotId })`
2. Convention variable Instantly unique **ou** mapping documenté par niche
3. Cron link-provisioning aligné
4. Streamlit links UI lit la même API

**Dépendances :** Phase 1 (slots / niche config).

**Fichiers :**

- `lib/legacy/link-tracking/provision-*.ts`
- `app/(legacy)/api/link-tracking/provision-leads/route.ts`
- `app/(legacy)/api/cron/link-provisioning/route.ts`
- `lib/backend/streamlit_links/`
- `lib/backend/shared/link_provision_client.py`

**Validation :**

- Smoke : provision 1 lead restaurant → Instantly var = URL slot client A
- Re-provision idempotent

**Risques :** campagnes live avec anciennes vars — migration copy Instantly obligatoire.

---

## Phase 3 — Routing multi-client (event type par client)

**Objectif :** généraliser pool-router + event types Calendly par client.

**Composants :**

1. Découpler `client_outreach_slots` de `agence_id` → `client_id` (table clients minimale ou stub)
2. Création/stockage `calendly_event_type_uri` par slot
3. Router fair-share pour niches hors restaurant/santé/btp
4. Observability `pool_router_runs` + alertes pool vide
5. Seat onboarding généralisé (invite org)

**Dépendances :** Phase 2 ; Calendly org access.

**Fichiers :**

- `lib/legacy/capacity/**`
- `lib/legacy/calendly-seat-onboarding/**`
- `app/(legacy)/api/cron/pool-router/route.ts`
- migrations capacity

**Validation :**

- 2 slots actifs même niche → leads distribués
- Bookings Calendly tombent sur le bon user/event
- Seat `active` requis avant `capacity_status=active` (si règle retenue)

**Risques :** mauvaise URL en prod = RDV chez le mauvais client — feature flag + dry-run.

---

## Phase 4 — Module Pré-vente unifié

**Objectif :** un moteur pré-vente auto post-booking (présentation | wizard), config par niche.

**Composants :**

1. Schema config pré-vente (lié `funnel_pages` ou table `niche_presale_config`)
2. Route/API lecture config par slug
3. Persist wizard answers → `profile`
4. Binding post `invitee.created` → URL pré-vente

**Dépendances :** booking stable (Phases 2–3).

**Fichiers :**

- `funnel_pages` / nouveau module lib (pas UI marketing)
- Webhook calendly side-effect link
- **Pas** rebuild sales-session live (hors scope)

**Validation :**

- Book lead → reçoit / ouvre page config niche
- Wizard writes profile JSON

**Risques :** HTML `reservation*.html` legacy — garder jusqu'à parity ; ne pas casser utm_content.

---

## Phase 5 — Modules optionnels unifiés (PB / PP / Nur)

**Objectif :** un orchestrateur de flags niche + files email existantes.

**Composants :**

1. Lire flags niche au book / pay / no-show
2. Post-booking : no-op si OFF (pas de jobs)
3. Post-payment : Stripe path + stub **À DÉCIDER** pour paiement tiers
4. Nurturing : unifier entrypoints no-show / close-indecis / upsell derrière conditions config
5. Idempotence + cancel cross-sequences (déjà partiel)

**Dépendances :** Phases 1 + 4.

**Fichiers :**

- `lib/legacy/booking-communication/orchestrator.ts`
- `lib/legacy/payments/stripe-webhook-*.ts`
- `lib/legacy/*-sequence/orchestrator.ts`
- crons booking-emails, onboarding, sequence-scheduler

**Validation :**

- Niche PB OFF → book n'insère aucun `booking_email_jobs`
- Niche Nur ON + no-show → sequence starts
- PB OFF + Nur ON OK

**Risques :** templates category encore `agence`/`entreprise` — mapper vers niches actives.

---

## Phase 6 — CRM Hercule (séparé)

**Objectif :** table `clients` + pipeline interne pour **clients d'Hercule uniquement**.

**Composants :**

1. Migration `clients`
2. Import depuis paiement Stripe / sales_call `paid` quand destinataire = Hercule
3. Relier slots outreach aux clients
4. Retraction / onboarding seat déjà existants branchés sur `clients`

**Dépendances :** Phases 3 + 5.

**Fichiers :**

- nouvelle migration + repo TS
- webhook Stripe branch « Hercule destination »
- admin APIs **minimales** (pas de dashboard produit complet)

**Validation :**

- Comptable paie Hercule → row `clients`
- Restaurant booke comptable tiers → **pas** de row `clients`

**Risques :** mélanger CRM et engine — tests d'isolation obligatoires.

---

## Phase 7 — Backend de gestion (conceptuel, hors `build/` 00–15)

**Objectif :** workflows qui relient le front de contrôle au moteur. Pas une spec UI.

**Dépendances :** Phase 6 (table `clients`) ; moteur / routing (Phases 2–3) pour le pool.

**Composants (voir [`workflows.md`](./workflows.md) §11, [`frontend.md`](./frontend.md)) :**

1. Onboarding (formulaire → insert) en plus ou à la place du seul W11 Stripe — **À DÉCIDER**
2. `delivery_start_at` (ex. signup + 20 j)
3. Lifecycle + éligibilité (couche distincte des slots)
4. Allocation / recalc quotas à l’entrée-sortie
5. Inbox + infra provisioning orchestrés
6. Génération de tâches ops
7. Queue : pas d’assignation avant la date d’éligibilité
8. Sync d’état : le front ne fait que lire / commander

**Fichiers :** canon `lib/doc/*` d’abord. Implémentation = **deuxième chantier** — ne pas injecter dans `build/phases` 00–15 ni `build/decisions.md`.

**Validation :** client créé J0 n’apparaît pas dans le picker pool ; à `delivery_start_at` + lifecycle éligible, le router peut l’assigner ; pause retire du picker.

**Risques :** fusionner lifecycle client et `capacity_status` ; calculer J+20 en React.

**Ensuite seulement :** spécifier le front-end (écrans Client Management / System Management).

---

## Hors scope explicite

- Spec UI / dashboard SaaS redesign (après Phase 7 seulement)
- `/onboarding/*` et `/suivi/*` pages (roadmap product)
- Matching `matches` / deliverance buyer-seller
- Réécriture Streamlit → Next
- Nouveau job runtime (Inngest/n8n)
- Modifier `build/decisions.md` ou phases 00–15 pour la gestion clientèle

---

## Ordre des dépendances

```
Phase 0 freeze
    ↓
Phase 1 data model niches
    ↓
Phase 2 provisioning + Calendly var client
    ↓
Phase 3 multi-client routing + seat
    ↓
Phase 4 pré-vente unifiée
    ↓
Phase 5 PB / PP / Nur flags
    ↓
Phase 6 CRM Hercule
    ↓
Phase 7 backend gestion (conceptuel)
    ↓
Spec front-end (hors ce plan)
```

---

## Critères transversaux (toutes phases)

| Critère | Exigence |
|---------|----------|
| Orchestration | webhook → job → cron only |
| Idempotence | keys uniques sur jobs/events |
| State layers | ne pas fusionner `lead_statut` / payments / capacity / **lifecycle client** |
| Secrets | `.env` only |
| Tests | smoke scripts existants + nouveaux pour routing |
| Observability | logs structured + garder pool_router_runs / bypass_events |

---

## Risques globaux

1. **Campagnes Instantly live** pendant migration de variables
2. **Tables deprecated encore écrites** par webhooks legacy
3. **Calendly org permissions** insuffisantes pour auto-invite
4. **Ambiguïté paiement tiers** (Post-payment) bloque Phase 5 partielle — stub + flag
5. **Sur-architecture** — rester opinionated ; pas de framework générique de niches
