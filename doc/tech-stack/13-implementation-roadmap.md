# 13 — Roadmap d’implémentation (agent IA)

```
status: canonical
audience: coding-agent
depends_on: 00-decisions.md, 03-data-model.md, 04-transitions.md
do_not:
  - Exécuter l’étape N+1 si N n’a pas ses critères d’acceptation
  - Construire /suivi avant l’étape 2
  - Modifier la prod « en passant » hors de l’étape
```

**Une étape = un PR (ou un commit cohérent).** Lire le module lié. Ne pas coder deux modules en parallèle.

---

## STEP 1 — Secrets fail-closed

- **But :** crons et webhooks refusent si le secret est vide.
- **IDs :** ENG-04
- **Fichiers :** `app/api/cron/**/route.ts`, `app/api/webhooks/**/route.ts`, helpers auth existants
- **Schéma :** aucun
- **Composants :** aucun
- **Orchestrateurs :** tous les crons/webhooks live
- **Acceptation :** `CRON_SECRET=""` → 401 ; Calendly sans clé → 401 (plus d’ignore signature)
- **Tests :** route tests 401
- **Stop if :** un webhook Instantly casserait ACK 200 métier (les skips métier restent 200 ; l’auth se fait **avant**)
- **Module :** — (infra)

---

## STEP 2 — Data truth

- **But :** deux champs d’état + tables NEW vides de writers produit.
- **IDs :** DB-01, SOT-01, FND-01, FND-05, FND-16, SAL-01
- **Fichiers :** `supabase/migrations/YYYYMMDDHHMMSS_product_truth.sql` ; types manuels alignés
- **Schéma :** enum `product_statut` ; colonnes leads ; `payments` ; `matches` ; `appointments` ; `sales_calls` — voir [03-data-model.md](./03-data-model.md)
- **Composants :** int-database (mettre à jour le registry)
- **Orchestrateurs :** aucun writer encore
- **Acceptation :** migration appliquée ; `lead_statut` inchangé ; pas de `PAID` dans l’enum CRM
- **Tests :** SQL constraints (un match `open` / agence)
- **Stop if :** fusion des enums tentée
- **Module :** [modules/data-truth.md](./modules/data-truth.md)

---

## STEP 3 — Service transitions + types email produit

- **But :** un module serveur unique + CHECK email_type étendu (jobs pas encore émis).
- **IDs :** ENG-06, EML-01
- **Fichiers :** `lib/product/transitions.ts`, `lib/commercial/constants.ts`, migration CHECK
- **Schéma :** nouveaux `email_type` (nullable usage)
- **Composants :** aucun UI
- **Orchestrateurs :** orch-product-emails (stub)
- **Acceptation :** transitions unit-testées ; React sans copie des règles
- **Tests :** matrice 04-transitions (cas PAID gate, double match)
- **Stop if :** logique écrite dans un `"use client"`
- **Module :** [modules/internal-infra.md](./modules/internal-infra.md)

---

## STEP 4 — Cockpit `/internal` fiches

- **But :** lister/éditer leads, créer lien Stripe (`pending`), table RDV vide prête.
- **IDs :** FND-02, ADM-01, ADM-03, SEC-01, INT-01 (création session seulement)
- **Fichiers :** `app/internal/(shell)/leads/**`, `app/api/internal/payments/checkout/route.ts`
- **Schéma :** insert `payments.pending`
- **Composants :** int-leads, int-lead-detail, int-pay-link (trigger)
- **Orchestrateurs :** aucun webhook Stripe encore (étape 5)
- **Acceptation :** ops voit `statut` CRM **et** `product_statut` ; pas de login
- **Tests :** checkout crée session + row pending
- **Stop if :** on ajoute Clerk
- **Module :** [modules/internal-infra.md](./modules/internal-infra.md)

---

## STEP 5 — Onboarding public + Stripe webhook

- **But :** inscription → ONBOARDED ; paiement succeeded → IN_DELIVERANCE auto.
- **IDs :** FND-03, FND-04, BIZ-04, INT-01, CVG checkbox
- **Fichiers :** `app/onboarding/**`, `app/api/onboarding/**`, `app/api/webhooks/stripe/route.ts`
- **Schéma :** `profile.form`, `cvg_version` / `cvg_accepted_at`
- **Composants :** onb-form (trigger)
- **Orchestrateurs :** orch-stripe
- **Acceptation :** sans paiement, **pas** de recherche ; webhook idempotent
- **Tests :** inscription seule ≠ IN_DELIVERANCE
- **Stop if :** CTA Activer sur un dashboard client
- **Module :** [modules/onboarding.md](./modules/onboarding.md), [modules/payments-stripe.md](./modules/payments-stripe.md)

---

## STEP 6 — Délivrance emails + ADVANCE/DELAY

- **But :** timeline datée + jobs produit + boutons ops.
- **IDs :** FND-15, SOT-03, EML-01, CAP-01
- **Fichiers :** `lib/product/deliverance.ts`, API advance/delay
- **Schéma :** dates dans `profile` + colonnes `deliverance_*`
- **Composants :** int-lead-detail (trigger)
- **Orchestrateurs :** orch-product-emails
- **Acceptation :** DELAY +7 reschedule les jobs ; client pas encore de page
- **Tests :** constantes vs CGV (délais)
- **Stop if :** promote manuel obligatoire (happy path = auto PAID)
- **Module :** [modules/deliverance.md](./modules/deliverance.md)

---

## STEP 7 — Matching + Calendly livraison

- **But :** Mettre en lien → email entreprise → book → les deux MEETING_BOOKED + appointment.
- **IDs :** FND-05, FND-12, SUR-02, SUR-03, BIZ-03
- **Fichiers :** `app/api/internal/matches/route.ts`, branchement webhook Calendly par event type
- **Schéma :** `matches`, `appointments`
- **Composants :** int-match (trigger)
- **Orchestrateurs :** orch-delivery-calendly
- **Acceptation :** 2e match `open` rejeté ; vente Calendly **ne** crée **pas** d’appointment
- **Tests :** isolation event types
- **Stop if :** réutilisation du même event type vente
- **Module :** [modules/matching.md](./modules/matching.md)

---

## STEP 8 — Post-RDV survey + nurturing

- **But :** complete/no-show manuels ; survey ; nurturing NOT_PAID ; pas d’898.
- **IDs :** ORCH-01, FND-06, FND-07, FND-09, EML-02, EML-03, ADM-03
- **Fichiers :** `app/survey/[token]/page.tsx`, APIs appointments, jobs nurture
- **Schéma :** tokens survey, `sales_calls.not_paid`
- **Composants :** survey, int-appointments
- **Orchestrateurs :** orch-survey, orch-nurture
- **Acceptation :** un oui clôt le match, agence reste livrable ; paiement coupe nurture
- **Tests :** pas de 898 dans l’UI ; FORBIDDEN_COPY
- **Stop if :** reset dashboard à 0
- **Module :** [modules/post-rdv.md](./modules/post-rdv.md)

---

## STEP 9 — Pages suivi secret-link

- **But :** agence + entreprise voient la livraison ; no-show agence.
- **IDs :** SUR-01, SUR-03, BIZ-05, SEC-02
- **Fichiers :** `app/suivi/**`
- **Schéma :** lecture seule + POST no-show
- **Composants :** deliv-agence, deliv-entreprise (recipient)
- **Orchestrateurs :** aucun nouveau
- **Acceptation :** pas de login ; pas de bouton payer
- **Tests :** slug invalide → 404
- **Stop if :** self-serve matching
- **Module :** [modules/deliverance.md](./modules/deliverance.md) (front-client)

---

## STEP 10 — CMS funnels, sales-ops, cutover Streamlit

- **But :** funnels en DB ; `sales_calls` UI ; édition templates `/internal` ; Instantly send path = Next only.
- **IDs :** FUN-01, SAL-01, ADM-02, LEG-01, LEG-02
- **Fichiers :** tables CMS, `/internal/sales`, feature flag Streamlit send off
- **Schéma :** `funnel_pages`, snapshots Instantly optionnel
- **Composants :** int-sales, int-templates, int-funnels (edition DB)
- **Orchestrateurs :** orch-bypass (couper Streamlit send)
- **Acceptation :** double envoi E1 impossible ; Streamlit CRM marqué deprecated
- **Tests :** publish funnel depuis DB
- **Stop if :** extinction Streamlit **avant** parité liens/templates
- **Module :** [modules/cms-funnels.md](./modules/cms-funnels.md), [modules/sales-ops.md](./modules/sales-ops.md)
