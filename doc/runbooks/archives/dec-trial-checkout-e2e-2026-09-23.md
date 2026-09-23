# DEC trial checkout E2E — exécution 2026-09-23

## Automatisé (cette session)

| Étape | Commande | Résultat |
|-------|----------|----------|
| Webhook intégration | `pnpm test-dec-trial-webhook-integration` | **PASS** — `slug: 8IdTdq`, `sessionId: cs_test_e2e_dec_trial_1790170586765` (fixture, client supprimé en cleanup) |
| Smoke draft | `pnpm smoke-dec-trial-draft-e2e` | **FAIL** — session `cs_live_a19dvIaMmIxRX0864wwRlO9fidKTqE1dBeQhyZpOy3qWhQ7vQ6T6dHKXg9` (`.env` utilise `sk_live_`, pas `sk_test_`) |

## Manuel (à refaire avec clés test)

1. `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 pnpm dev:e2e`
2. `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → `STRIPE_WEBHOOK_SECRET`
3. `pnpm smoke-dec-trial-draft-e2e` (doit passer avec `cs_test_`)
4. Navigateur `/proposition#essai` + carte `4242…`
5. `pnpm verify-dec-trial-e2e -- --session=cs_test_... --sync`

## Sortie intégration (extrait)

```
stripe-webhook-dec-trial integration passed { slug: '8IdTdq', sessionId: 'cs_test_e2e_dec_trial_1790170586765' }
```

Note : billing portal log attendu avec customer fixture fictif (`No such customer`).
