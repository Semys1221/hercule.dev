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

Étapes **4–5** du dashboard client (`/dashboard/[slug]`).

1. Ops ou client : `POST /api/payments/checkout` avec `{ slug }` (agence Starter).
2. Row `payments.pending` + session Stripe embedded (`clientSecret`).
3. Webhook `checkout.session.completed` → `succeeded` → transition délivrance + cancel nurture.

Montants = `COMMERCIAL.*` uniquement. Idempotence `stripe_event_id`.

## Variables d'environnement obligatoires

| Variable | Rôle |
|----------|------|
| `STRIPE_SECRET_KEY` | Création session Checkout côté serveur |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Embed Stripe côté client |
| `STRIPE_PRICE_STARTER` | Price ID Starter 1 489 € (fallback `STRIPE_PRICE_MONTHLY_1489`) |
| `STRIPE_WEBHOOK_SECRET` | Signature webhook `checkout.session.completed` |
| `NEXT_PUBLIC_APP_URL` | `return_url` après paiement (ex. `https://www.hercule.dev`) |

Comptable (optionnel) : `STRIPE_PRICE_COMPTABLE_STARTER`, `STRIPE_PRICE_COMPTABLE_MONTHLY`, `STRIPE_PRICE_COMPTABLE_PACK3`.

Configurer sur **Vercel** (Production + Preview) et redéployer après ajout — les env vars ne sont pas rechargées sur un déploiement existant.

## Troubleshooting

| Symptôme | Cause probable |
|----------|----------------|
| Embed Stripe affiche `STRIPE_SECRET_KEY is not set` (avant fix prod) | Variables Stripe absentes sur Vercel |
| Embed affiche `Paiement indisponible` en production | Erreur serveur checkout — voir logs `[payments/checkout]` |
| `Invalid Stripe product configuration` en prod | Price ID ≠ 148 900 centimes ou produit sans « Starter » dans le nom |
| `offer_type 'starter_1489_5'` constraint | Migration `20260908120000_payments_starter_offer_type.sql` non appliquée |

## Routes

| Route | Usage |
|-------|-------|
| `POST /api/payments/checkout` | Agence Starter embedded checkout |
| `POST /api/payments/checkout-comptable` | Comptable (`offerType` mensuel ou pack) |
| `POST /api/webhooks/stripe` | `checkout.session.completed` |

Lien ops cockpit : `/dashboard/{slug}?checkout=1` (session pré-créée via cockpit Paiement).
