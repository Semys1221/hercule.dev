# 06 — Pages et apps (surfaces)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../06-surfaces-validation.md](../06-surfaces-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- **Site marketing** agence (`/`) et entreprise (`/entreprise`), FAQ, CGV.
- **Pages de prise de RDV** par lien secret (slug) pour la vente.
- **Outil interne** `/internal` (pas indexé Google).

**Pas encore live :** page de **suivi** pour l’agence ou l’entreprise payante.

---

## Questions

#### [SUR-01] Quelles **pages client** veux-tu construire en premier ?

- [x] **A (recommandé)** — **Suivi agence + entreprise** (lien secret, pas de login) + questionnaire après RDV.
- [ ] **B** — **Suivi agence seulement** ; entreprise = email + Calendly.
- [ ] **C** — **Aucun suivi** tant que le matching n’existe pas ; seulement site + prise de RDV vente.

---



#### [SUR-02] Les pages HTML de **prise de RDV vente** restent-elles **séparées** des RDV **livraison** (match agence↔entreprise) ?

- [x] **A (recommandé)** — **Oui**, URLs / Calendly différents : vente Hercule vs livraison.
- [ ] **B** — **Tout unifier** plus tard sur les mêmes pages.
- [ ] **C** — **Refaire en Next** tout de suite, même comportement vente.

---



#### [SUR-03] Quand un RDV **livraison** est booké, l’agence est prévenue comment ?

- [x] **A (recommandé)** — **Email + mise à jour** de sa page de suivi (date, lien visio).
- [ ] **B** — **Email seulement**.
- [ ] **C** — **Page de suivi seulement**, pas d’email.

---



#### [UI-01] Le **look** (couleurs, boutons, cartes) : tu veux quoi d’unifié ?

- [ ] **A (recommandé)** — **Même base** pour outil interne + futur suivi client ; le marketing peut rester un peu différent.
- [ ] **B** — **Trois styles** jusqu’à la fin de l’ancien outil Streamlit.
- [x] **C** — **Tout** (y compris marketing) au même style type « app moderne ».

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| SUR-01 | A | Suivi agence + entreprise + survey |
| SUR-02 | A | Calendly vente ≠ Calendly livraison |
| SUR-03 | A | Email + page suivi |
| UI-01 | C | Même langage visuel y compris marketing |


