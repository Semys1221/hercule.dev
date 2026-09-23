# Runbook — checkout essai DEC (E2E local test)

Valide le flux complet : proposition → Stripe embedded → redirect `/clients/{slug}` → Supabase → email `free_trial_started_1`.

## Prérequis

- Clés Stripe **test** (`sk_test_`, `pk_test_`) dans `.env`
- `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000`
- Resend sandbox (`pnpm dev:e2e` définit `onboarding@resend.dev`)
- Stripe CLI installé

## 1. Démarrer l’app

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 pnpm dev:e2e
```

## 2. Webhooks locaux

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`, redémarrer `pnpm dev:e2e` si le secret a changé.

## 3. Smoke draft (sans carte)

```bash
pnpm smoke-dec-trial-draft-e2e
```

Doit créer une session `cs_test_...` et valider Supabase + metadata Stripe.

## 4. Test intégration webhook (sans navigateur)

```bash
tsx --env-file=.env ./lib/legacy/payments/stripe-webhook-dec-trial.integration.test.ts
```

Simule `checkout.session.completed` et vérifie paiement + job email.

## 5. Paiement navigateur

1. Ouvrir http://localhost:3000/proposition#essai
2. Carte test : `4242 4242 4242 4242`, date future, CVC quelconque
3. Noter l’URL finale : `/clients/{slug}?paid=1&session_id=cs_test_...`

## 6. Vérification post-paiement

```bash
pnpm verify-dec-trial-e2e -- --session=cs_test_XXXX --sync
```

Optionnel après test : `--cleanup` pour supprimer le client de test.

Si le webhook est lent, relancer la même commande avec `--sync` uniquement.

## Critères de succès

| Étape | Commande | Succès |
|-------|----------|--------|
| Draft | `pnpm smoke-dec-trial-draft-e2e` | exit 0 |
| Webhook | `stripe-webhook-dec-trial.integration.test.ts` | exit 0 |
| Paiement | Navigateur 4242 | redirect `/clients/...` |
| Post-check | `pnpm verify-dec-trial-e2e --session=... --sync` | exit 0 |

## Dépannage

- **`cs_live_` dans le smoke** : mauvaises clés Stripe (live au lieu de test).
- **Paiement OK, Supabase pending** : webhook non reçu → `stripe listen` + `--sync`.
- **Email job failed** : vérifier `BOOKING_RESEND_FROM` / clé Resend ; consulter `booking_email_jobs`.
