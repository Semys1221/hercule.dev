# 07 — Pages de vente (funnels)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../07-funnels-validation.md](../07-funnels-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **pages de vente** se éditent en fichiers ; l’éditeur interne existe.
- Le **parcours live** reste : email froid → lien → RDV appel commercial.

---

## Questions

#### [FUN-01] Les **landings de vente** : on continue à les éditer en fichiers dans `/internal`, sans page publique tant qu’on ne les branche pas ?

- [ ] **A (recommandé)** — **Oui** : fichiers = brouillon ; page publique seulement quand on mappe explicitement.
- [x] **B** — Tout mettre en **base de données** (CMS).
- [ ] **C** — **Abandonner** l’éditeur ; landings figées en code.

---



#### [FUN-02] « **898 € = 3 rendez-vous** » : ça veut dire quoi ?

- [ ] **A (recommandé)** — **3 mises en lien complètes** (3 attributions / 3 cycles de match).
- [x] **B** — Pas d’offre 898 au MVP.
- [ ] **C** — **3 RDV Calendly** sur le match en cours seulement.

*Aligné avec BIZ-06 et FND-10.*

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| FUN-01 | B | CMS funnels en base |
| FUN-02 | B | Pas d’898 |


