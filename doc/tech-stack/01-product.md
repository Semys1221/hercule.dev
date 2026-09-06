# 01 — Produit

```
status: canonical
audience: coding-agent
depends_on: 00-decisions.md
decisions: BIZ-01 BIZ-02 BIZ-03 BIZ-04 BIZ-05 BIZ-06 BIZ-07 BIZ-08 BIZ-09 BIZ-10 CPY-01 CPY-04 FND-06 FND-07 FND-09 FND-11 SAL-02
do_not:
  - Vendre ou encaisser le 2500 €/mois
  - Coder l’offre 898 €
  - Terminer le pack agence parce qu’un match est SOLD
  - Faire payer l’entreprise
```

---

## Ce que Hercule vend

Hercule met en relation **entreprises** (PME/TPE, gratuites) et **agences web** (payantes).

- L’agence **close** elle-même (Starter).
- Hercule **n’est pas** commissionné sur les ventes de l’agence.
- L’offre **2 500 €/mois** (« Hercule close ») = **vitrine**. Aucune route, aucun webhook, aucun `payments.offer_type = hercule_2500` au MVP.

---

## Unité livrée : Attribution

Une Attribution = mise à disposition **exclusive** d’une demande entreprise qualifiée + **RDV planifié** dans l’agenda de l’agence.

| Événement | Effet crédit |
|-----------|----------------|
| RDV livraison **planifié** | −1 Attribution |
| No-show **entreprise** (signalé ≤ 48 h) | Recrédit + remplacement ≤ 14 j ouvrés |
| RDV honoré sans vente | **Pas** de recrédit |
| Vente (survey) | Match clôturé ; **pack / abo continue** |

Compteur = agrégat `appointments` (voir data-model). **Jamais** un statut `MEETING_n`.

---

## Offres commercialisées (MVP)

### A — Mensuel sans engagement

- **1 489 € / mois**
- SLA volume : **3–4 RDV honorés / mois** @ allocation 30 inbox (CAP-01 / C-02)
- Résiliation : crédits non utilisés **perdus** sauf RDV déjà planifiés à honorer (BIZ-10)

### B — Pack 3 mois

- **989 € × 3 = 2 967 €** (réglable en une fois)
- **15 attributions**
- Garantie : si CA généré via Hercule **&lt; 4 500 €** sur 3 mois → jusqu’à **15 remplacements** (mêmes règles Attribution)
- Vente pendant le pack **n’éteint pas** les crédits restants

### Non commercialisé

- 2 500 €/mois (vitrine)
- 898 €
- 1 500 € one-shot / pack 5 attributions

---

## Qui fait quoi

| Acteur | Doit | Ne fait pas (MVP) |
|--------|------|-------------------|
| **Hercule ops** | Qualifier, matcher, envoyer lien Stripe, confirmer paiement, juger no-show douteux, valider garantie | Self-serve catalogue |
| **Agence** | Onboarding, suivre, signaler no-show, survey « vendu ? » | Payer seule depuis le dashboard, choisir ses demandes |
| **Entreprise** | Booker Calendly livraison, survey embarquement | Payer, upsell |

---

## Cycle pack vs cycle match

```
sales_call NOT_PAID → nurturing plein tarif (prix ne baisse pas)
sales_call + Stripe webhook → payments row → product_statut ONBOARDED
                 → si PAID : auto IN_DELIVERANCE
match ouvert (1 à la fois) → RDV → survey
  oui  → match SOLD ; agence reste livrable (crédits / mois)
  non  → nouvelle recherche ou nurturing ; pas d’898
entreprise refuse suite → ARCHIVED (cette fiche) ; rematch possible vers autre agence
```

CTA 1 489 / 989×3 sur la page survey = **renouvellement optionnel**, pas un reset.
