# Documentation Hercule — entrée agent IA

```
status: canonical
audience: coding-agent
depends_on: none
do_not:
  - Lire archive/ comme spec de build
  - Recocher archive/planning/
  - Étendre lead_statut avec PAID, MEETING_n, SOLD
  - Coder avant d’avoir lu 00-decisions + 02-state-machines + 03-data-model + l’étape N du roadmap
```

**Date de gel :** 2026-09-06.  
Le code suit [`tech-stack/13-implementation-roadmap.md`](./tech-stack/13-implementation-roadmap.md), une étape à la fois.

---

## Ordre de lecture obligatoire

1. [`tech-stack/00-decisions.md`](./tech-stack/00-decisions.md) — tags CONFIRMED / REJECTED / DEPRECATED / NEW / UNCHANGED / MIGRATION REQUIRED
2. [`tech-stack/01-product.md`](./tech-stack/01-product.md) — offre, Attribution, pack
3. [`tech-stack/02-state-machines.md`](./tech-stack/02-state-machines.md) — 4 couches d’état
4. [`tech-stack/03-data-model.md`](./tech-stack/03-data-model.md) — tables live vs NEW
5. [`tech-stack/04-transitions.md`](./tech-stack/04-transitions.md) + [`05-events.md`](./tech-stack/05-events.md)
6. [`tech-stack/13-implementation-roadmap.md`](./tech-stack/13-implementation-roadmap.md) — **seule** checklist de build
7. Le module de l’étape en cours sous [`tech-stack/modules/`](./tech-stack/modules/)

Compléments selon l’étape : composants, orchestrateurs, API, surfaces, emails, intégrations, sécurité, CGV, capacity, constantes.

---

## Ce dossier

| Chemin | Rôle |
|--------|------|
| `doc/tech-stack/` | **Canon.** Spec de build. |
| `doc/crm-deployment.md` | Checklist déploiement CRM live. |
| [`archive/`](../archive/README.md) | Hors spec. Planning gelé, SOP, copy Instantly, anciennes docs. |

---

## Interdits globaux

- Une seule colonne `lead_statut` pour clic Instantly + paiement + livraison.
- Offre **898 €**. Pack **5 attributions à 1 489 € one-shot**. Prix d’entrée **1 500 €**.
- Rétractation **4 jours** (retirée des CGV).
- Reset dashboard agence à la vente.
- Table `communications`.
- Clerk / n8n / Inngest.
- Resusciter `app/streamlit_funnels`.
- Parser `cvg_master.md` au runtime.
- Pages client **avant** l’étape 2 du roadmap (data truth).
- Self-checkout Stripe sur le dashboard client (le lien Stripe est envoyé par l’ops).
- Matching et RDV vente Hercule sur le **même** événement Calendly.

---

## Première étape code

Roadmap étape 1 : secrets fail-closed (`ENG-04`).  
Roadmap étape 2 : `product_statut`, `payments`, `matches`, `appointments`, `sales_calls`.
