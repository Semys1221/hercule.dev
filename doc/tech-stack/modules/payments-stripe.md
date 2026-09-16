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
| `STRIPE_WEBHOOK_SECRET` | Signature webhook Stripe |
| `NEXT_PUBLIC_APP_URL` | `return_url` après paiement (ex. `https://www.hercule.dev`) |

### Agence — 2 offres, paiement 50/50

| Variable | Montant | Phase |
|----------|---------|-------|
| `STRIPE_PRICE_AGENCE_STARTER_DEPOSIT` | 499 € | deposit |
| `STRIPE_PRICE_AGENCE_STARTER_BALANCE` | 499 € | balance |
| `STRIPE_PRICE_AGENCE_GROWTH_DEPOSIT` | 749 € | deposit |
| `STRIPE_PRICE_AGENCE_GROWTH_BALANCE` | 749 € | balance |

Lookup keys Stripe agence (prod, créés via MCP) :
- `agence_starter_998_deposit` → `price_1UDf2wBd01AMeiaQvafqpUoc`
- `agence_starter_998_balance` → `price_1UDf2wBd01AMeiaQXMsGzVQK`
- `agence_growth_1498_deposit` → `price_1UDf2wBd01AMeiaQQP36mSak`
- `agence_growth_1498_balance` → `price_1UDf2wBd01AMeiaQkdAlLNZd`

Legacy (clients antérieurs) :
- `STRIPE_PRICE_STARTER` — 1 489 € (fallback `STRIPE_PRICE_MONTHLY_1489`)

### Comptable — 3 offres

| Variable | Offre (nom affiché) | Montant | Mode Stripe | `offer_type` |
|----------|---------------------|---------|-------------|--------------|
| `STRIPE_PRICE_COMPTABLE_STARTER` | **Hercule Lite** | 1 799 €/mois | `subscription` (recurring) | `starter_999_5` |
| `STRIPE_PRICE_COMPTABLE_MONTHLY` | **Hercule Starter** | 2 199 €/mois | `subscription` (recurring) | `monthly_1499` |
| `STRIPE_PRICE_COMPTABLE_PACK3` | **Pack 3 mois Starter** | 5 277,60 € | `payment` (one-shot) | `pack_3x1499` |

Lookup keys Stripe comptable (prod, sept. 2026) — **recurring monthly** pour Lite et Starter :
- `comptable_lite_1799_monthly` → `price_1UFE8oBd01AMeiaQV6PauMkI` (`STRIPE_PRICE_COMPTABLE_STARTER`, 1 799 €/mois)
- `comptable_starter_2199_monthly` → `price_1UFE8rBd01AMeiaQcfNXx6kC` (`STRIPE_PRICE_COMPTABLE_MONTHLY`, 2 199 €/mois)
- `comptable_pack3_5277` → `price_1UFE8sBd01AMeiaQjwDBB5Ry` (`STRIPE_PRICE_COMPTABLE_PACK3`, one-shot 5 277,60 €)

Montants attendus = `COMMERCIAL_COMPTABLE` (`179_900` / `219_900` / `527_760` centimes). Anciens price IDs (`price_1UE5g*`) désactivés.

Checkout embarqué : session de vente live (`/internal/funnels/comptable/sales/funnel` → closing **Activation & paiement**) et dashboard client (`/dashboard/{slug}`).

**Ops :** créer ou remplacer les Prices Stripe Lite et Starter par des **prices recurring monthly** (1 799 € et 2 199 €) et le pack one-shot (5 277,60 €). Configurer les lookup keys ci-dessus (noms legacy). Mettre à jour les env vars Vercel puis redéployer.

**Webhook :** configurer en plus de `checkout.session.completed` les événements `invoice.paid` (renouvellements) et `customer.subscription.deleted` (résiliation).

### Comptable — Acquisition 1 mois (Payment Link closer)

| Variable | Offre | Montant | Mode Stripe | `offer_type` |
|----------|-------|---------|-------------|--------------|
| `STRIPE_PRICE_COMPTABLE_ACQUISITION_1489` | **Acquisition 1 mois** | 1 489 €/mois | `subscription` (recurring) | `comptable_acquisition_1489_1m` |
| `STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489` | Payment Link `buy.stripe.com` | — | — | metadata `product=comptable_acquisition_1489` |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489` | Copie UI sales sliders | — | — | même URL que ci-dessus |

Provision : `pnpm provision-comptable-acquisition-1489-stripe` → lookup key `comptable_acquisition_1489_monthly`.

Webhook `checkout.session.completed` sans `comptable_id` : provision auto du lead `comptable` depuis l’email Stripe + séquence email post-paiement (4 emails).

Configurer sur **Vercel** (Production + Preview) et redéployer après ajout.

## Troubleshooting

| Symptôme | Cause probable |
|----------|----------------|
| Embed affiche `Paiement indisponible` (agence) | Env vars agence deposit manquantes ou migration `payment_phase` non appliquée |
| Embed affiche `Paiement indisponible` (comptable) | Price IDs comptable absents dans Stripe ou lead `comptable` introuvable pour le slug |
| Checkout comptable Lite/Starter échoue | Price ID n'est pas **recurring** — recréer avec `billing_period: month` |
| `Invalid Stripe product configuration` en prod | Price ID ≠ montant attendu (99 800 / 149 900 / 359 800 centimes) |
| Solde non proposé (agence) | Livraison incomplète (`attributionsUsed < attributionsTotal`) |
| Legacy clients | `starter_1489_5` / `pack_989x3` — pas de solde 50/50 |

## Routes

| Route | Usage |
|-------|-------|
| `POST /api/payments/checkout` | Agence — acompte 50 % (`offerType`: `starter_998_5` \| `growth_1498_10`) |
| `POST /api/payments/checkout-balance` | Agence — solde 50 % après livraison complète |
| `POST /api/payments/checkout-comptable` | Comptable — abonnement Lite/Starter ou pack one-shot |
| `POST /api/webhooks/stripe` | `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted` |

Lien ops cockpit : `/dashboard/{slug}?checkout=1`.
