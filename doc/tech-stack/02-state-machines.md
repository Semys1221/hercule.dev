# 02 — Machines d’état (4 couches)

```
status: canonical
audience: coding-agent
depends_on: 00-decisions.md, 01-product.md
decisions: FND-01 DB-01 FND-16 SAL-01 SOT-01 FND-04 FND-06 FND-08
do_not:
  - Ajouter PAID, NOT_PAID, MEETING_1, SOLD dans lead_statut
  - Utiliser product_statut pour l’appel de vente Hercule
  - Auto-promote à l’onboarding sans row payments succeeded
```

Quatre couches **indépendantes**. Un écran peut les afficher ensemble ; le code les écrit séparément.

---

## 1. CRM acquisition — `agence.statut` / `entreprise.statut`

**Colonne existante** `lead_statut`. **UNCHANGED.**

`NOTBOOKED → CLICKED → MEETING_BOOKED → CONFIRMED | CANCELLED`

`ONBOARDED` existe déjà dans l’enum Postgres : **ne plus l’utiliser comme statut CRM**. Après onboarding produit, `statut` CRM peut rester `CONFIRMED` ; le parcours payant vit dans `product_statut`.

Writers : Instantly/link-tracking, webhook Calendly **vente**, crons booking.

Calendly de **cette** couche = appel commercial Hercule. **Pas** le Calendly match.

---

## 2. Livraison — `product_statut` (NEW)

Enum **nouveau** (ne pas fusionner dans `lead_statut`) :

| Valeur | Sens |
|--------|------|
| `NONE` | Pas encore client produit (défaut) |
| `ONBOARDED` | Formulaire inscrit ; **pas** de recherche tant que pas PAID |
| `IN_DELIVERANCE` | Recherche active |
| `MATCH_PROPOSED` | Match ouvert (1 max / agence) |
| `MEETING_BOOKED` | RDV livraison planifié (les **deux** fiches, FND-12) |
| `POST_RDV_SURVEY` | En attente questionnaire |
| `SOLD` | Transitoire côté agence : **ce match** réussi — puis retour `IN_DELIVERANCE` si pack/abo actif |
| `ARCHIVED` | Entreprise refuse de continuer (FND-08) |
| `CANCELLED` | Compte agence résilié (ops) |

`SOLD` n’est **pas** terminal du compte agence. Outcome persistant : `matches.outcome = sold`.

Happy path :

```
NONE --onboarding--> ONBOARDED --payment.succeeded--> IN_DELIVERANCE
  --admin.match--> MATCH_PROPOSED --calendly.delivery.booked--> MEETING_BOOKED
  --admin_or_client.complete_or_noshow--> POST_RDV_SURVEY
  --survey.yes--> (match sold) --> IN_DELIVERANCE
  --survey.no_continue--> IN_DELIVERANCE
  --entreprise.refuse--> ARCHIVED (entreprise only)
```

---

## 3. Paiement — table `payments` (NEW)

Pas un enum lead. `NOT_PAID` vit sur `sales_calls.status`.

Gate délivrance : `payments.status = succeeded` **uniquement**.

---

## 4. Appel de vente — table `sales_calls` (NEW)

Domaine **séparé** du matching. Nurturing (EML-02) sur `not_paid`. Stop immédiat si paiement succeeded.
