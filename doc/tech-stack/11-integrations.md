# 11 — Intégrations

```
status: canonical
audience: coding-agent
depends_on: 08-api.md, 03-data-model.md
decisions: INT-01 INT-02 INT-03 ENG-12 ENG-13 SUR-02
do_not:
  - Stripe self-checkout sur le dashboard client
  - Clerk
  - Scraper dans /internal
  - Un seul event type Calendly pour vente et match
```

| Service | Rôle MVP | Tag |
|---------|----------|-----|
| Supabase | SoT | UNCHANGED |
| Resend | Emails | UNCHANGED |
| Calendly | 2 event types : vente vs livraison | UNCHANGED + NEW event |
| Instantly | Froid + bypass + AI reply | ops, hors livraison |
| cron-job.org | Crons Hobby | UNCHANGED |
| Stripe | Payment Link / Checkout + webhook | **NEW** — ops crée le lien |
| Outscraper / Pappers / MyEmailVerifier | Streamlit scraper | hors Next |
| xAI/Grok | AI reply ops | UNCHANGED |

Stripe : l’ops clique « créer lien de paiement » dans `/internal`. L’agence paie sur Stripe. Webhook confirme. **Pas** de bouton Activer sur `/suivi`.

Env NEW : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plus tard `STRIPE_PRICE_MONTHLY_1489`, `STRIPE_PRICE_PACK_989X3` (ou amount dynamique).
