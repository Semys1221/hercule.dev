# 03 — Suivi des étapes client (données)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../03-database-validation.md](../03-database-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.  
> Détail technique des tables → document parent.

---

## Ce qu’on garde

- Deux types de fiches : **agence** et **entreprise** (séparées).
- La **base de données** est la référence pour qui est où dans le parcours.
- Les emails planifiés et les infos du formulaire vivent dans des champs prévus à cet effet.

---

## Questions

#### [DB-01] Comment veux-tu suivre l’étape d’un client : une seule colonne « statut » ou deux (vente vs livraison) ?

Aujourd’hui le statut mélange « a cliqué sur le lien » et « en recherche active ».

- [x] **A (recommandé)** — **Deux suivis** : statut vente (comme aujourd’hui) + statut livraison (parcours payant).
- [ ] **B** — **Une seule liste** de statuts qui grandit (vente + livraison dedans).
- [ ] **C** — **Deux fiches** liées (prospect vs client payant).

---



#### [DB-02] Les délais, la timeline affichée, le questionnaire et les offres 898/1489 : tout dans un **bloc JSON** par fiche, ou plein de colonnes séparées ?

- [x] **A (recommandé)** — **Bloc JSON** pour config / affichage / offres ; l’essentiel (email, statut, RDV) en colonnes simples.
- [ ] **B** — **Moins de JSON** ; tout mettre en colonnes ou tables dédiées.
- [ ] **C** — JSON **seulement** pour le formulaire ; le reste en tables.

---



## Réponses


| ID    | Choix | Notes |
| ----- | ----- | ----- |
| DB-01 | A | statut CRM + product_statut |
| DB-02 | A | profile JSON config/UI/offres |


