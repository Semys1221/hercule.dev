# 02 — Composants et briques UI

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../02-components-validation.md](../02-components-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.  
> Inventaire détaillé des composants → document parent.

---

## Ce qu’on garde

- Le **site** et l’**outil interne** utilisent les mêmes briques visuelles (boutons, cartes, tableaux).
- L’**éditeur de funnels** compose des pages à partir d’un catalogue de blocs.
- Les pages **suivi client** (onboarding, suivi, questionnaire) sont prévues mais **pas encore construites**.

---



## Questions



#### [COMP-01] La page `/internal/components` : référence vivante de tout ce qui existe (pages, APIs, crons) ou simple aperçu ?

*Aujourd’hui ~22 entrées ; ce package en liste plus.*

- [x] **A (recommandé)** — **Référence alignée** sur la doc finale ; la page interne = vue de cette liste.
- [ ] **B** — **Aperçu seulement** ; la doc `doc/` reste la référence.
- [ ] **C** — **Supprimer** les pages inventaire ; tout en markdown seulement.

---



#### [COMP-02] Dans l’éditeur de funnel, peut-on **créer de nouveaux types de blocs** depuis l’interface ?

- [x] **A (recommandé)** — **Non** : catalogue **fermé** ; les devs ajoutent des blocs via fichiers / code.
- [ ] **B** — **Oui** : l’UI permet de créer de nouveaux types.
- [ ] **C** — Catalogue modifiable **seulement** par fichiers (jamais l’UI).

---



## Réponses


| ID      | Choix | Notes |
| ------- | ----- | ----- |
| COMP-01 | A | /internal/components = vue de la doc |
| COMP-02 | A | Catalogue funnel fermé |


