# 23 — Clarifications post-validation

> `status:` frozen  
> `audience:` coding-agent  
> `depends_on:` [README.md](./README.md), [simplified_version/](./simplified_version/)  
> `decisions:` FND-16, FND-04, BIZ-06, FND-14, FND-09

**Date :** 2026-09-06.  
**Règle :** ces clarifications **écrasent** les cases contradictoires. Ne pas réouvrir le questionnaire.

La validation dans `simplified_version/` est **terminée**. Deux arrêts techniques ont été levés en session (machines d’état + cycle de pack).

---

## FND-16 — paiement n’est pas la machine de livraison

**Case originale :** B (`NOT_PAID → PAID → ONBOARDING → ACTIF` = machine canonique).  
**Clarification (fait foi) :** traité comme **A**.

Paiement = **événement / enregistrement** (`payments`, éventuellement statut d’un `sales_calls`). Ensuite les états de délivrance de **FND-01 A** (`ONBOARDED` … `SOLD` sur `product_statut`).

`NOT_PAID` vit sur l’**appel de vente** (sales-ops / nurturing), **pas** sur l’enum de livraison, **pas** dans `lead_statut`.

---

## FND-04 — auto-promote seulement si PAID

**Case originale :** C (auto à l’inscription **ou** au paiement).  
**Clarification (fait foi) :** auto vers `IN_DELIVERANCE` **uniquement au PAID**. Jamais à la seule inscription.

Inscription → `ONBOARDED`. L’email « formulaire bien reçu » peut partir à l’inscription. La recherche active attend le paiement (BIZ-04 A).

---

## BIZ-06 — cycle du pack (jamais coché)

**Clarification (fait foi) :**

- Un match à la fois (assignation exclusive, BIZ-03 A).
- Pas d’offre 898 € (aligné FND-10 B, FUN-02 B).
- **Une vente ne termine pas le pack** : crédits restants / mois en cours continuent. 1 489 €/mois ou 989 × 3 = renouvellement **optionnel**.
- Attribution = RDV **planifié** (BIZ-02 A) ; no-show entreprise = recrédit.

Cela **écrase** la note FND-09 « dashboard reset à 0 ».

---

## FND-14 — historique matches

**Case originale :** C (« sans objet si FND-05 B »). **Invalide** : FND-05 = A.  
**Clarification (fait foi) :** **A** — conserver l’historique ; unlink seulement bouton admin.

---

## FND-09 — renouvellement in-page, pas de reset

**Case originale :** A (CTA in-page, pas d’email auto).  
**Note originale** (« dashboard reset à 0 ») : **REJECTED**.  
**Fait foi :** CTA 1 489 €/mois ou 989 × 3 **optionnel** sur la page survey. Le pack / l’abo **continue**. Un « oui » survey clôt le **couple match**, pas le compte agence (voir FND-07).
