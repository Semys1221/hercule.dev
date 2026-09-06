# 08 — API, webhooks, crons

```
status: canonical
audience: coding-agent
depends_on: 04-transitions.md, 07-orchestrators.md, 12-security.md
decisions: API-01 SEC-01 SEC-02 ENG-04 ENG-05 FND-03
do_not:
  - Ajouter Clerk pour « sécuriser » (contredit SEC-01 B)
  - Laisser un cron ouvert si CRON_SECRET vide
  - POST client hors onboarding + survey + no-show
```

Auth **produit** `/internal` et `/api/admin/*` : **aucune**.  
Auth **infra** : Bearer / signatures — **fail-closed**.

---

## Live — garder

| Route | Kind | Auth infra |
|-------|------|------------|
| `POST /api/webhooks/calendly` | webhook | signature |
| `POST /api/webhooks/instantly` | webhook | bearer |
| `POST /api/webhooks/instantly/reply` | webhook | bearer |
| `POST /api/webhooks/resend` | webhook | signature |
| `POST /api/webhooks/supabase-link-tracking` | webhook | secret |
| `GET /api/cron/booking-emails` | cron | CRON_SECRET |
| `GET /api/cron/instantly-bypass-jobs` | cron | CRON_SECRET |
| `GET /api/cron/instantly-bypass-pipeline` | cron | CRON_SECRET |
| `GET /api/cron/ai-reply-agent-jobs` | cron | CRON_SECRET |
| `/api/link-tracking/*` | api | slug |
| `/api/booking-communication/*` | api | admin URL |
| `/api/admin/funnels*` `/faq` `/pricing` `/demandes` `/onboarding/[category]` | api | none |
| `GET /api/calendly/availability` | api | — |
| `GET /api/booking/config` | api | — |

---

## NEW

| Route | Kind | Étape | Effet |
|-------|------|-------|-------|
| `POST /api/webhooks/stripe` | webhook | 5 | paiement → délivrance |
| `POST /api/internal/payments/checkout` | api | 4 | session Stripe, `payments.pending` |
| `POST /api/onboarding/[category]` | api | 5 | public → ONBOARDED |
| `POST /api/internal/matches` | api | 7 | Mettre en lien |
| `POST /api/internal/appointments/:id/complete` | api | 8 | ORCH-01 |
| `POST /api/internal/appointments/:id/no-show` | api | 8 | |
| `POST /api/survey/[token]` | api | 8 | FND-07 |
| `POST /api/suivi/no-show` | api | 9 | BIZ-05 |
| `POST /api/internal/deliverance/advance` | api | 6 | FND-15 |
| `POST /api/internal/deliverance/delay` | api | 6 | +7 j |

Idempotence : Stripe `event.id` ; Calendly invitee URI unique sur `appointments`.
