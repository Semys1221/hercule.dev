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

1. Client choisit **Hercule Starter** ou **Hercule Growth** (step 4).
2. `POST /api/payments/checkout` avec `{ slug, offerType }` — acompte 50 %.
3. Row `payments.pending` (`payment_phase: deposit`) + session Stripe embedded.
4. Webhook `checkout.session.completed` → `succeeded` → transition délivrance.
5. Après livraison complète des contrats : `POST /api/payments/checkout-balance` — solde 50 %.

Montants = `COMMERCIAL.*` uniquement. Idempotence `stripe_event_id`.

## Variables d'environnement obligatoires

| Variable | Rôle |
|----------|------|
| `STRIPE_SECRET_KEY` | Création session Checkout côté serveur |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Embed Stripe côté client |
| `STRIPE_WEBHOOK_SECRET` | Signature webhook `checkout.session.completed` |
| `NEXT_PUBLIC_APP_URL` | `return_url` après paiement (ex. `https://www.hercule.dev`) |

### Agence — 2 offres, paiement 50/50

| Variable | Montant | Phase |
|----------|---------|-------|
| `STRIPE_PRICE_AGENCE_STARTER_DEPOSIT` | 499 € | deposit |
| `STRIPE_PRICE_AGENCE_STARTER_BALANCE` | 499 € | balance |
| `STRIPE_PRICE_AGENCE_GROWTH_DEPOSIT` | 749 € | deposit |
| `STRIPE_PRICE_AGENCE_GROWTH_BALANCE` | 749 € | balance |

Lookup keys Stripe (prod, créés via MCP) :
- `agence_starter_998_deposit` → `price_1UDf2wBd01AMeiaQvafqpUoc`
- `agence_starter_998_balance` → `price_1UDf2wBd01AMeiaQXMsGzVQK`
- `agence_growth_1498_deposit` → `price_1UDf2wBd01AMeiaQQP36mSak`
- `agence_growth_1498_balance` → `price_1UDf2wBd01AMeiaQkdAlLNZd`

Legacy (clients antérieurs) :
- `STRIPE_PRICE_STARTER` — 1 489 € (fallback `STRIPE_PRICE_MONTHLY_1489`)

### Comptable — 3 offres (paiement intégral)

| Variable | Offre (nom affiché) | Montant | `offer_type` |
|----------|---------------------|---------|--------------|
| `STRIPE_PRICE_COMPTABLE_STARTER` | **Hercule Lite** | 999 € TTC | `starter_999_5` |
| `STRIPE_PRICE_COMPTABLE_MONTHLY` | **Hercule Starter** | 1 499 €/mois | `monthly_1499` |
| `STRIPE_PRICE_COMPTABLE_PACK3` | **Pack 3 mois Starter** | 3 598 € TTC | `pack_3x1499` |

Montants attendus = `COMMERCIAL_COMPTABLE` (`99_900` / `149_900` / `359_800` centimes). Les noms de variables env sont conservés pour compatibilité ; seuls les libellés UI/CVG ont été renommés (Lite / Starter / Pack).

Checkout embarqué : session de vente live (`/internal/funnels/comptable/sales/funnel` → closing **Activation & paiement**) et dashboard client (`/dashboard/{slug}`).

Configurer sur **Vercel** (Production + Preview) et redéployer après ajout.

## Troubleshooting

| Symptôme | Cause probable |
|----------|----------------|
| Embed affiche `Paiement indisponible` | Env vars agence deposit manquantes ou migration `payment_phase` non appliquée |
| `Invalid Stripe product configuration` en prod | Price ID ≠ montant attendu (49 900 / 74 900 centimes) |
| Solde non proposé | Livraison incomplète (`attributionsUsed < attributionsTotal`) |
| Legacy clients | `starter_1489_5` / `pack_989x3` — pas de solde 50/50 |

## Routes

| Route | Usage |
|-------|-------|
| `POST /api/payments/checkout` | Agence — acompte 50 % (`offerType`: `starter_998_5` \| `growth_1498_10`) |
| `POST /api/payments/checkout-balance` | Agence — solde 50 % après livraison complète |
| `POST /api/payments/checkout-comptable` | Comptable (`offerType` mensuel ou pack) |
| `POST /api/webhooks/stripe` | `checkout.session.completed` |

Lien ops cockpit : `/dashboard/{slug}?checkout=1`.
