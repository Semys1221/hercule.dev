# Capacity — Intégration profile & data

> Module : [Capacity](./README.md) · Voir aussi : [Profile JSON](../02-profile-json.md) · [Deliverance DB](../deliverance/db.md)

---

## 1. Intro (langage simple)

Les dates promesses au client vivent dans **`profile.capacity`** (JSON) + quelques colonnes SQL indexables pour le panel Streamlit. Le front suivi et les emails lisent ces champs — pas de dates hardcodées en React.

---

## 2. Extension `profile.capacity`

```typescript
capacity: {
  allocation_inboxes: number;           // 15 ou 30
  constrained: boolean;
  capacity_phase: "bootstrap" | "stable";
  queue_status: "none" | "warmup" | "capacity";
  queue_position?: number;
  estimated_activation_at?: string;     // ISO
  infrastructure_ready_at?: string;     // ISO — fin warmup batch
  estimated_first_u4_at?: string;
  estimated_five_u4_at?: string;
  estimated_ten_u4_at?: string;
  promised_first_match_by?: string;
  promised_first_rdv_by?: string;
  rdv_month_target: number;             // 3–4 @ 30, 2–3 @ 15
  funnel_baseline: {
    reply_rate: 0.01;
    positive_rate: 0.30;
    booking_rate: 0.30;
    closing_rate: 0.60;
    sends_per_inbox_day: 20;
    predicted_u4_monthly: number;       // calculé à l'allocation
  };
}
```

### Extension `profile.communication.delays`

```typescript
communication: {
  delays: {
    base_match_days: number;
    retraction_days: number;
    search_start_offset_days: number;
    queue_warmup_days: 15;
    first_match_promise_days: 21;
    first_rdv_promise_days: 35;
    first_u4_promise_days: 21;          // @ 30 inbox ; 28 @ 15
    five_u4_promise_days: 35;
    ten_u4_promise_days: 60;
  };
}
```

---

## 3. Colonnes SQL (`agence`)

| Colonne | Type | Rôle |
|---------|------|------|
| `capacity_status` | enum | ACTIVE, CONSTRAINED_15, QUEUED_WARMUP, QUEUED_CAPACITY |
| `inbox_allocation` | int | 15 ou 30 |
| `queue_position` | int nullable | FIFO |
| `estimated_activation_at` | timestamptz | File / warmup |

Table **`inbox_pool`** : voir [01-inbox-model.md](./01-inbox-model.md).

---

## 4. Calcul dates (TypeScript)

```typescript
const SEND_TO_U4 = 0.01 * 0.30 * 0.30 * 0.60; // 0.00054
const EMAILS_PER_U4 = 1 / SEND_TO_U4;         // ~1852
const OPS_BUFFER_DAYS = 7;

function daysToU4(inboxes: number, n: number): number {
  return Math.ceil((n * EMAILS_PER_U4) / (inboxes * 20)) + OPS_BUFFER_DAYS;
}

function computeDeliveranceMilestones(
  allocation: number,
  activationAt: Date,
  phase: "bootstrap" | "stable",
): {
  estimated_first_u4_at: Date;
  estimated_five_u4_at: Date;
  estimated_ten_u4_at: Date;
} {
  const buffer = phase === "bootstrap" ? 7 : 0;
  return {
    estimated_first_u4_at: addDays(activationAt, daysToU4(allocation, 1) + buffer),
    estimated_five_u4_at: addDays(activationAt, daysToU4(allocation, 5) + buffer),
    estimated_ten_u4_at: addDays(activationAt, daysToU4(allocation, 10) + buffer),
  };
}
```

### `estimated_completion_at` (deliverance)

Remplace le seul `base_match_days` :

```
estimated_first_u4 = max(
  deliverance_started_at + first_u4_promise_days,
  estimated_activation_at + first_u4_promise_days
)
```

---

## 5. Prompt d'action IA

```
Profile capacity (doc/tech-stack/capacity/06-profile-integration.md).

- buildDefaultProfile() injecte capacity + funnel_baseline
- computeDeliveranceMilestones on promote / allocation change
- GET suivi expose estimated_*_at read-only

Réutiliser : lib/booking-communication/schedule.ts (addDays pattern)
Références : 02-profile-json.md, deliverance/db.md
```
