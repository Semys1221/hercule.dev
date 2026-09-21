# States

**Règle absolue :** ne pas fusionner les couches d'état. Une seule colonne ne porte pas outreach + paiement + livraison.

---

## Couche 1 — Lead outreach (`lead_statut`)

**EXISTANT** sur tables lead (`comptable`, `cif`, … et legacy `agence`/`entreprise`/`jum`).

| Valeur | Signification | Transition typique |
|--------|---------------|-------------------|
| `NOTBOOKED` | Provisionné, pas booké | défaut |
| `CLICKED` | Clic lien tracking | click API |
| `BOOKED` | Legacy alias | migré → MEETING_BOOKED |
| `MEETING_BOOKED` | Calendly invitee.created | booking |
| `CONFIRMED` | Confirm présence | confirm API |
| `CANCELLED` | Annulé / no-confirm | cancel / h20 |
| `ONBOARDED` | Onboarding form done | dashboard / profile |

Machine :

```
NOTBOOKED → CLICKED → MEETING_BOOKED → CONFIRMED
                ↑            │
                └────────────┴→ CANCELLED
MEETING_BOOKED / CONFIRMED → ONBOARDED (post produit)
```

---

## Couche 2 — Bypass pipeline

Table `instantly_bypass_pipeline` — **EXISTANT**.

| step | Meaning |
|------|---------|
| `step_0` | Interested, pas encore E1 Hercule |
| `step_1` | E1 envoyé |
| `step_2` | E2 envoyé |
| `step_3` | E3 envoyé / séquence finie |
| `replies_to_handle` | Reply à traiter |

Jobs `instantly_bypass_jobs` : `pending` → `sent` | `cancelled` | `failed`.

Events `instantly_bypass_events` : `sent` | `skipped` | `failed` (idempotence).

---

## Couche 3 — Payments

Table `payments` — **EXISTANT**.

Champs clés :

- `offer_type` (SKUs : monthly_1499, saas_autonome_10rdv, hercule_liberal_1200_monthly, …)
- `payment_phase` : `deposit` | `balance` | `full`
- Stripe session / subscription IDs
- Owner FK vers une table lead (agence/entreprise/comptable/… — schéma legacy)

**Pas** un statut dans `lead_statut`.

---

## Couche 4 — Capacity / SaaS autonome

**EXISTANT** — migrations `saas_autonomous_capacity`.

### `prospect_pool.status`

`available` → `assigned` → `in_sequence` → `booked` | `exhausted` | `cooloff`

### `client_outreach_slots.capacity_status`

`queued_warmup` → `active` → `paused` | `churned`

### `lead_assignments.sequence_state`

`tap1_pending` → `tap1_sent` → `tap2_pending` → `tap2_sent` → `cooloff` | `booked` | `replied`

### `inbox_pool.status`

`warmup` → `active` → `paused` | `retired`

Niches pool actuelles : `restaurant` | `sante` | `btp`.  
**À CONSTRUIRE** : étendre à `architect` (+ éventuellement aligner `comptable`/`cif` si pool partagé).

---

## Couche 5 — CRM Hercule / lifecycle client

**À CONSTRUIRE.** Système **séparé** de l'engine. Représente qui paie Hercule **et** s’il peut recevoir des prospects.

**Ne pas fusionner** avec `lead_statut`, `client_outreach_slots.capacity_status`, ni `inbox_pool.status`.

Machine visée (W-G8 — non figée, **À DÉCIDER** colonnes exactes) :

```
created → onboarding → provisioning → warming → eligible → active
                                                      ↓
                                              paused | cancelled
paused → active (commande resume, si conditions : date, inboxes, quota)
```

| État proposé | Description |
|--------------|-------------|
| `created` | Row `clients` inséré (formulaire et/ou W11) |
| `onboarding` | Données / niche en cours de validation |
| `provisioning` | Infra, inboxes, event type, tâches ops |
| `warming` | Inboxes / seat en warm-up ; **pas** encore dans le pool |
| `eligible` | `now >= delivery_start_at` (et prérequis infra) ; peut entrer en queue |
| `active` | Dans le pool ; reçoit des prospects selon quota restant |
| `paused` | Plus d’assignations ; ressources conservées ou gelées (**À DÉCIDER**) |
| `cancelled` | Sortie ; recalc quotas (W-G9) |

États d’éligibilité opérationnelle (W-G3), superposition possible de lecture : `pending` / `warming` / `eligible` / `active` / `paused`. Alignement 1:1 avec la machine ci-dessus : **À DÉCIDER**.

Champs temporels (proposition) : `delivery_start_at`, éventuellement `eligible_at`. Exemple : `delivery_start_at = signup_date + 20 jours` — constante vs offre **À DÉCIDER**.

Ancien brouillon `lead | customer | paused | churned` : remplacé par cette machine. `churned` slot reste sur `capacity_status` (couche 4).

Options table (inchangées) :

1. Nouvelle table `clients` (recommandé métier, D1)
2. Réutiliser `agence` deprecated (déconseillé)
3. Étendre `client_outreach_slots` seulement (trop étroit — slots ≠ CRM / lifecycle)

Gate pool (canon cible) : **éligible** **et** capacité restante **et** `now >= delivery_start_at`. Pas « le row existe ». Voir [`routing.md`](./routing.md) §5.

---

## Couche legacy — `product_statut` (DEPRECATED métier matching)

**EXISTANT** mais liée au modèle buyer/seller / deliverance :

`NONE` → `PAID_PENDING_ONBOARDING` → `ONBOARDED` → `IN_DELIVERANCE` → `MATCH_PROPOSED` → `MEETING_BOOKED` → `POST_RDV_SURVEY` → `SOLD` | `ARCHIVED` | `CANCELLED`

**Ne pas étendre** pour le nouveau modèle grille. Documenter pour code legacy uniquement. Transitions : `lib/legacy/product/transitions.ts`.

---

## Couche legacy — `sales_calls.status`

**EXISTANT** :

`scheduled` | `completed` | `no_show` | `not_paid` | `paid` | `lost`

Utile pour nurturing post-RDV commercial. Garder comme couche séparée.

---

## Couche legacy — `matches` / `appointments`

| Entity | Statuses |
|--------|----------|
| `matches` | `proposed` → `booked` → `sold` |
| `appointments` | `scheduled` → `completed` \| `no_show_entreprise` \| `no_show_agence` \| `cancelled` |

**DEPRECATED métier** (matching). `appointments` peut rester **À DÉCIDER** pour livraison interne Hercule.

---

## Couche — Booking email jobs

`pending` → `sent` | `cancelled` | `failed`

Idempotency via `idempotency_key` unique.

---

## Couche — AI reply

`ai_reply_agent_messages.ai_status` :

`pending` | `auto_replied` | `skipped_unsafe` | `skipped_ooo` | `skipped_collision` | `manual_replied` | `manual_queued` | `failed`

Config campaign : `not_initialized` | `waiting_for_replies` | `paused`

---

## Couche — Calendly seat onboarding

`awaiting_invite` → `invite_pending` → `active` | `reminder_sent`  
+ `calendly_invitation_status` : `pending` | `accepted` | `declined`

---

## Couche — Funnel pages

`draft` | `published`

---

## Résumé couches actives vs deprecated

| Couche | Rôle | Statut |
|--------|------|--------|
| lead_statut | Outreach → booking | ACTIF |
| bypass pipeline | Sending subsequence | ACTIF |
| payments | Argent | ACTIF |
| capacity/SaaS | Multi-client routing stock | ACTIF |
| sales_calls | Outcome RDV commercial | ACTIF |
| CRM / lifecycle clients | Clients Hercule ; éligibilité pool | À CONSTRUIRE |
| product_statut / matches | Matching buyer-seller | DEPRECATED |
| appointments | Delivery RDV | À DÉCIDER |
