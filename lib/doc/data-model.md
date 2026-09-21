# Data model

Schéma dérivé des migrations `lib/backend/supabase/migrations/` et des types `lib/legacy/**/types.ts`.

Légende : **EXISTANT** / **À CONSTRUIRE** / **DEPRECATED** / **À DÉCIDER**.

---

## 1. Entités conceptuelles

| Entité | Rôle | Persistance |
|--------|------|-------------|
| Niche | Config de la grille (ligne) | `niche_outreach_config` + presets + templates |
| Prospect / Lead | Contact scrapé dans une niche | Table par niche OU `prospect_pool` |
| Client destinataire | Calendrier qui reçoit le RDV | `client_outreach_slots` (+ CRM Hercule si Hercule) |
| Campagne Instantly | Sending cold | IDs dans config |
| Booking | RDV Calendly | Champs Calendly sur lead + `sales_calls` |
| Payment | Transaction | `payments` |
| Job email | File async | `booking_email_jobs`, `instantly_bypass_jobs`, … |
| Client Hercule | Qui paie Hercule ; lifecycle + 1re livraison | **À CONSTRUIRE** table `clients` |

Décision métier confirmée : **garder une table lead par niche** (pas une table unique universelle pour l'instant).

---

## 2. Tables actives (engine)

### 2.1 Lead tables par niche

#### `comptable` — EXISTANT

Lead outreach + booking fields (slug, Instantly IDs, Calendly payload, `lead_statut`, `product_statut`, `profile`, retraction, reservation/confirmation links).

#### `cif` — EXISTANT

Même forme que comptable (liens `reservation_cif_link`, …).

#### `prospect_pool` — EXISTANT (SaaS)

Stock partagé post-scrape avant assignation client.

| Colonne clé | Notes |
|-------------|-------|
| email, niche | niche ∈ `restaurant`, `sante`, `btp` |
| status | available → … |
| assigned_client_id | FK `client_outreach_slots` |

**À CONSTRUIRE** : `architect` dans le CHECK niche ; éventuellement tables lead dédiées si hors pool.

#### Pattern lead (canon)

Toute table niche devrait exposer au minimum :

- `id`, `email`, `statut` (`lead_statut`)
- `slug` (+ URLs reservation/confirmation)
- Instantly IDs
- Calendly fields (invitee URI, scheduled_at, join/reschedule/cancel URLs)
- `profile` JSONB
- timestamps

---

### 2.2 Config niche

#### `niche_outreach_config` — EXISTANT

| Colonne | Rôle |
|---------|------|
| niche PK | actuellement `agence\|comptable\|entreprise\|cif\|jum` |
| instantly_campaign_id | Campagne |
| instantly_list_id | List (ajout migration CIF) |
| calendly_event_type_uri | Event type (souvent **niche-level**, pas client-level) |

**À CONSTRUIRE** :

- Étendre CHECK aux niches actives : `comptable`, `cif`, `restaurant`, `sante`, `btp`, `architect`
- Retirer / geler `agence`, `entreprise`, `jum`
- Flags modules optionnels : `post_booking_enabled`, `post_payment_enabled`, `nurturing_enabled` (**À DÉCIDER** colonnes exactes)
- Séparer event type niche-default vs event types **par client**

#### `email_variable_bindings` — EXISTANT

Variables Instantly activées par niche.

---

### 2.3 Capacity / multi-client

| Table | Rôle | Statut |
|-------|------|--------|
| `client_outreach_slots` | 1 slot par client payant (agence_id legacy) | EXISTANT — **À CONSTRUIRE** : découpler de `agence_id` |
| `inbox_pool` | Comptes Instantly attachés | EXISTANT |
| `inbox_provision_queue` | File DFY inboxes | EXISTANT |
| `lead_assignments` | Trace prospect → slot + double-tap | EXISTANT |
| `pool_router_runs` | Logs router | EXISTANT |

Note : `client_outreach_slots.agence_id` → FK `agence` **DEPRECATED**. Migration cible : FK vers table `clients` ou owner générique.

---

### 2.4 Sending / bypass / AI

| Table | Rôle |
|-------|------|
| `instantly_bypass_config` | Per campaign |
| `instantly_bypass_templates` | E1–E3 / variants |
| `instantly_bypass_events` | Idempotence |
| `instantly_bypass_jobs` | Queue |
| `instantly_bypass_pipeline` | CRM steps |
| `ai_reply_agent_*` | Config, messages, jobs, settings, blocklist |

Toutes **EXISTANT**.

---

### 2.5 Booking communication

| Table | Rôle |
|-------|------|
| `booking_email_jobs` | File Resend |
| `booking_email_templates` | Copy éditable |
| `email_sequence_recipients` | Management cockpit recipients |

**EXISTANT**.

---

### 2.6 Payments

`payments` — **EXISTANT**. Owner FKs multi-niche (nullable columns + check). Offer types étendus au fil des migrations.

---

### 2.7 Sales / funnels

| Table | Rôle | Statut |
|-------|------|--------|
| `sales_calls` | RDV commercial outcomes | EXISTANT — garder |
| `funnel_pages` | CMS pré-vente / funnels | EXISTANT — à brancher module Pré-vente |
| `calendly_seat_onboarding` | Invite org post-pay | EXISTANT — lié clients Hercule |
| `*_demandes` | Carousel marketing | EXISTANT — hors engine core |

---

## 3. Tables DEPRECATED

Ne plus étendre. Documentées pour lecture du code legacy.

| Table | Raison |
|-------|--------|
| `agence` | Niche agence web + buyer logic |
| `entreprise` | Seller side matching |
| `jum` | Pas une niche canon |
| `matches` | Matching agence↔entreprise |
| `appointments` | Delivery matching — **À DÉCIDER** si réutilisé pour livraison Hercule seule |

Autres artefacts liés : `product_statut` transitions matching, Revente pipeline agence, etc.

---

## 4. Table CRM Hercule — À CONSTRUIRE

Proposition (non figée — **À DÉCIDER** colonnes). D1 : table **`clients` neuve**.

```text
clients
  id
  email / company / legal footer fields
  niche_preference (type de niche souhaité)
  calendly_user_uri / event_type_uri
  stripe_customer_id
  lifecycle_status
    created | onboarding | provisioning | warming
    | eligible | active | paused | cancelled
  delivery_start_at     -- ex. signup + 20 j (exemple, À DÉCIDER)
  eligible_at           -- optionnel, dénormalisé
  quota fields          -- volume / période (À DÉCIDER forme)
  accepted_products JSONB
  created_at / updated_at
```

Relations :

- `client_outreach_slots.client_id` → `clients.id`
- `inbox_pool` / file provision → client (association **À CONSTRUIRE** si pas déjà via slot)
- Optionnel : `origin_lead_id` + `origin_niche` (provenance engine)
- Optionnel : `client_tasks` (W-G7) — **À DÉCIDER** vs réemploi jobs

Gate moteur : ne pas router vers un client au seul motif que le row existe. Conditions : `lifecycle` éligible/active **et** capacité restante **et** `now >= delivery_start_at`. [`routing.md`](./routing.md) §5.

Entrées row : formulaire onboarding (W-G1) et/ou paiement Hercule (W11 / D16) — **À DÉCIDER**.

---

## 5. Relations (engine actif)

```
niche_outreach_config (1) ── configures ──> Instantly campaign + default Calendly
        │
        ▼
lead table / prospect_pool (N)
        │
        ├── provisioned Instantly lead
        │
        ├── lead_assignments ──> client_outreach_slots ──> calendly_scheduling_url
        │                              │
        │                              └── inbox_pool
        │
        ├── sales_calls (0..N)
        ├── booking_email_jobs (0..N)
        └── payments (0..N)  [si post-payment Stripe]
```

---

## 6. Configuration ownership

| Donnée | Appartient à |
|--------|--------------|
| Preset scrape, taxonomy | Plateforme / niche (admin Hercule) |
| Campaign templates E1–E3 | Niche / campaign |
| Lien Calendly injecté | **Client destinataire** (via routing) |
| Page pré-vente | Niche (+ override client possible — À DÉCIDER) |
| Flags PB/PP/Nur | Niche |
| Infos légales footer | Client (CRM) |
| Agenda connecté | Client (Calendly org) |
| Quotas / inbox allocation | Client (lifecycle) + slot |
| `delivery_start_at` | Client (backend gestion) |
| Profile réponses wizard | Prospect / lead |

---

## 7. Idempotence & jobs (pattern data)

Toutes les files async partagent le pattern :

- `idempotency_key UNIQUE`
- `status` + `scheduled_for`
- Index partiel `WHERE status = 'pending'`

Tables : `booking_email_jobs`, `instantly_bypass_jobs`, `ai_reply_agent_jobs`, `instantly_bypass_events`.

---

## 8. RLS

Presque toutes les tables : `ENABLE ROW LEVEL SECURITY` **sans** policies publiques dans les migrations. Accès runtime via **service role** Next/scripts.

---

## 9. Écarts à combler (synthèse)

| Écart | Tag |
|-------|-----|
| Niches actives dans `niche_outreach_config` CHECK | À CONSTRUIRE |
| Table lead `architect` ou pool extension | À CONSTRUIRE |
| Découpler slots de `agence_id` | À CONSTRUIRE |
| Flags modules optionnels | À DÉCIDER |
| Table `clients` CRM + lifecycle / `delivery_start_at` | À CONSTRUIRE |
| Tâches ops client (`client_tasks` ou jobs) | À DÉCIDER |
| Event type **par client** comme SoT | À CONSTRUIRE (métier confirmé) |
| Freeze / archive tables deprecated | À CONSTRUIRE (ops) |
