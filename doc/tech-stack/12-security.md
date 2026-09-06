# 12 — Sécurité et permissions

```
status: canonical
audience: coding-agent
depends_on: 08-api.md
decisions: SEC-01 SEC-02 API-01 ENG-03 ENG-04
do_not:
  - Introduire Clerk / login client au MVP
  - Exposer SUPABASE_SERVICE_ROLE_KEY au navigateur
  - Skip signature webhook si la clé env est vide
```

---

## Politique produit (consciente du risque)

| Surface | Auth applicative |
|---------|------------------|
| `/internal`, `/api/admin/*`, `/api/internal/*` | **Aucune.** URL non publique + `noindex`. |
| Suivi / survey / réservation | Slug ou token ; pas de compte |
| Crons | Bearer `CRON_SECRET` **obligatoire** |
| Webhooks Stripe / Calendly / Resend / Instantly | Signature ou bearer **obligatoire** |

Secret d’orchestration vide → **401 / 403**. Aujourd’hui fail-open : **étape 1 roadmap**.

RLS on, 0 policy = deny anon. Écritures = service role serveur.

Survey : token opaque unique par appointment × audience, single-use on submit.

`.env` : ne plus documenter `ADMIN_SECRET` (CF-09). Ajouter clés Stripe à l’étape paiements.
