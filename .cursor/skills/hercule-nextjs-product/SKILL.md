---
name: hercule-nextjs-product
description: >-
  Hercule.dev matching, deliverance, Stripe payments, appointments, nurture sequences.
  Use when editing lib/matching, lib/deliverance, lib/payments, Stripe webhook,
  no-show sequence, upsell, or admin matching APIs.
---

# Next.js Product

Matching, deliverance, payments, and product nurture sequences. Many features are **roadmap-gated** — check [doc/tech-stack/13-implementation-roadmap.md](../../doc/tech-stack/13-implementation-roadmap.md) before building NEW surfaces.

## Matching

| File | Role |
|------|------|
| `lib/matching/orchestrator.ts` | Match orchestration |
| `lib/matching/store.ts` | Match persistence |
| API: `/api/admin/matching` | Admin matching ops |
| API: `/api/admin/matches` | Match list |

Module doc: [doc/tech-stack/modules/matching.md](../../doc/tech-stack/modules/matching.md)

## Deliverance

| File | Role |
|------|------|
| `lib/deliverance/timeline-steps.ts` | Delivery timeline steps |
| API: `/api/admin/deliverance/[matchId]` | Deliverance actions |

Module doc: [doc/tech-stack/modules/deliverance.md](../../doc/tech-stack/modules/deliverance.md)

## Payments (Stripe)

| File | Role |
|------|------|
| `lib/payments/stripe.ts` | Stripe client + checkout |
| `/api/payments/checkout` | Create checkout session |
| `/api/webhooks/stripe` | `checkout.session.completed` |

Module doc: [doc/tech-stack/modules/payments-stripe.md](../../doc/tech-stack/modules/payments-stripe.md)

On payment: update `payments` table + auto deliverance + cancel nurture (roadmap).

## Appointments

| Route | Purpose |
|-------|---------|
| `POST /api/admin/appointments/[id]/complete` | Mark RDV complete |
| `POST /api/admin/appointments/[id]/no-show` | Mark no-show |

Calendly has **no reliable no-show webhook** — human action only (ORCH-01).

## Nurture sequences

| Lib | Trigger |
|-----|---------|
| `lib/no-show-sequence/orchestrator.ts` | Client/admin no-show |
| `lib/no-show-sequence/reset.ts` | Reset no-show sequence |
| `lib/upsell-sequence/orchestrator.ts` | Upsell nurture |
| `lib/close-indecis-sequence/orchestrator.ts` | Close indecisive leads |

Booking templates for no-show: `lib/admin/bookings/not-present-send.ts`

## Product transitions

- `lib/product/transitions.ts` — product state machine transitions
- Cross-ref dashboard: [hercule-nextjs-dashboard](hercule-nextjs-dashboard/SKILL.md)

## Admin APIs (product domain)

| Route | Purpose |
|-------|---------|
| `/api/admin/matching` | Run/manage matching |
| `/api/admin/deliverance/[matchId]` | Deliverance workflow |
| `/api/admin/appointments/*` | Appointment status |
| `/api/admin/bookings/reset-no-show` | Reset no-show sequence |
| `/api/admin/bookings/not-present` | Not-present email flow |
| `/api/admin/bookings/workflow-action` | Booking workflow actions |

## MCP

- **Stripe** — checkout, webhooks, customer portal
- **Supabase** — matches, payments, appointments

## Roadmap gates

Do not implement ahead of roadmap step:

- `/onboarding/agence`, `/onboarding/entreprise` (step 5)
- `/suivi/*` client pages (step 9)
- Full stripe auto-deliverance (step 5)
- Survey automation post-complete RDV (step 8)

## Cross-links

- State machines: [doc/tech-stack/02-state-machines.md](../../doc/tech-stack/02-state-machines.md)
- Communication sequences: [hercule-nextjs-communication](hercule-nextjs-communication/SKILL.md)
