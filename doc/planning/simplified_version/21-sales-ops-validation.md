# 21 — Suivi des appels de vente

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../21-sales-ops-validation.md](../21-sales-ops-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **appels commerciaux** (avant paiement) ≠ le **matching** après paiement.
- Une spec décrit notes, statuts PAID / NO SHOW / NOT PAID sur **l’appel** — **rien n’est codé**.
- L’**entreprise** est gratuite côté CGV (pas d’upsell).

---

## Questions

#### [SAL-01] Le **suivi des appels de vente** (notes, PAID / NO SHOW / NOT PAID, prévisions, taux de closing) : dans `/internal` ?

*Ce n’est pas le CRM Instantly ni le matching livraison.*

- [x] **A (recommandé)** — **Oui** : domaine **séparé** du statut lead ; Calendly = RDV planifiés ; notes en **base** (pas fichier local) ; stats calculées.
- [ ] **B** — **Hors MVP** : Calendly + notes Streamlit / hors app suffisent.
- [ ] **C** — **Fusionner** dans le même statut lead que tout le reste.

---



#### [SAL-02] Le « sales » **entreprise** : vente payante, comme l’agence, ou acquisition gratuite ?

- [x] **A (recommandé)** — **Pas de vente payante** entreprise : qualification gratuite ; métriques ops seulement, pas de CA entreprise.
- [ ] **B** — **Même workflow payant** que l’agence (contredit CGV entreprise — préciser en note).
- [ ] **C** — **Domaine séparé** (expliquer ce qui est vendu en note).

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| SAL-01 | A | Sales-ops in /internal ; notes en base |
| SAL-02 | A | Entreprise jamais payante |


