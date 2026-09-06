# Module — Paiements Stripe

```
status: canonical
audience: coding-agent
depends_on: ../11-integrations.md, ../constants-commercial.md
decisions: INT-01 FND-03 BIZ-04 FND-16 ORCH-03
do_not:
  - Checkout self-serve sur /suivi
  - offer_type hercule_2500
```

Étapes **4–5**.

1. Ops : `POST /api/internal/payments/checkout` avec `offer_type` `monthly_1489` | `pack_989x3`.
2. Row `payments.pending` + URL Stripe.
3. Webhook `checkout.session.completed` (ou `payment_intent.succeeded`) → `succeeded` → transition délivrance + cancel nurture.

Montants = `COMMERCIAL.*` uniquement. Idempotence `stripe_event_id`.
