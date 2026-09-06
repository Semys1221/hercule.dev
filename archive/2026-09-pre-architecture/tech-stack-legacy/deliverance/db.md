# Deliverance — Database

> Module : [Deliverance](./README.md) · Lignes : [Front client](./front-client.md) · [Front interne](./front-interne.md) · [Communication](./communication.md)  
> Contexte : [Profile JSON](../02-profile-json.md) · [Capacity](../capacity/README.md) · Prérequis : [Onboarding](../onboarding/README.md)

---

## 1. Intro (langage simple)

L'admin lance la « délivrance » : recherche en cours. La timeline et les dates d'emails viennent du **`profile`** créé à l'onboarding (ex. +4 jours si rétractation). Les **dates de RDV honorés estimées** viennent de **`profile.capacity`** — voir [capacity/06-profile-integration.md](../capacity/06-profile-integration.md).

---

## 2. Architecture développée (pour IA de coding)

### Trigger

`POST /api/deliverance/promote` → `statut = 'IN_DELIVERANCE'`

### Init deliverance

```typescript
const delays = profile.communication.delays;
deliverance_started_at = now();
deliverance_step = 1;
deliverance_total_steps = profile.display.timeline.length;

// Dates capacity-aware (remplace seul base_match_days pour la promesse client)
const activationAt = profile.capacity?.estimated_activation_at
  ? new Date(profile.capacity.estimated_activation_at)
  : deliverance_started_at;
const milestones = computeDeliveranceMilestones(
  profile.capacity?.allocation_inboxes ?? 30,
  activationAt,
  profile.capacity?.capacity_phase ?? "stable",
);
estimated_completion_at = milestones.estimated_five_u4_at;
// Fallback timeline interne si capacity absent :
// addDays(now(), delays.base_match_days + delays.retraction_days)
```

### Colonnes SQL (index/requêtes uniquement)

```sql
ALTER TYPE public.lead_statut ADD VALUE IF NOT EXISTS 'IN_DELIVERANCE';

ALTER TABLE public.agence
  ADD COLUMN IF NOT EXISTS deliverance_step INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deliverance_total_steps INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS deliverance_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_completion_at TIMESTAMPTZ;
-- Idem entreprise
```

Labels timeline : **lire** `profile.display.timeline` — pas de colonne `deliverance_metadata` redondante sauf cache optionnel.

### API admin

`POST /api/deliverance/admin/action` : `ADVANCE_STEP`, `DELAY`, `SET_STEP` — Bearer auth.

### GET public

`GET /api/deliverance/[category]/by-link/[slug]` — calcule `steps[].status` depuis `deliverance_step` + `profile.display.timeline`.

---

## 3. Prompt d'action IA

```
DB deliverance (doc/tech-stack/deliverance/db.md + 02-profile-json.md).

- promote → IN_DELIVERANCE, dates depuis profile.communication.delays
- GET by-link : steps from profile.display.timeline
- admin/action pour ADVANCE_STEP, DELAY

Réutiliser : lib/booking-communication/schedule.ts

Tests :
- retraction_days=4 → premier job email +4j après deliverance_started_at
- GET timeline labels = profile.display.timeline
```
