# 14 — Quelle doc fait foi, par quoi commencer

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../14-implementation-boundaries-validation.md](../14-implementation-boundaries-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- D’abord **valider** ce package, puis **architecture**, puis **outil interne**, puis **un module à la fois**.
- Pas tout construire en parallèle.

---

## Questions

#### [BND-01] Après validation, **quelle documentation** est la référence pour l’équipe (le reste est archivé) ?

*Trois dossiers docs actifs = risque de contradiction.*

- [x] **A (recommandé)** — `doc/tech-stack/` réécrit selon vos réponses ; anciens dossiers `documentations_2` archivés ; SOP commerciaux à part.
- [ ] **B** — `documentations_2` devient la référence ; tech-stack archivé.
- [ ] **C** — **Nouveau** dossier `doc/architecture/` seul ; tout le reste archivé.

---



#### [BND-02] Quel est le **premier module produit** à coder après l’infra `/internal` ?

- [x] **A (recommandé)** — Infra + **modèle de statuts / vérité données** (DB-01, SOT-01) **avant** toute page client ; puis onboarding ; matching seulement si FND-05 ≠ B.
- [ ] **B** — D’abord **copier Streamlit en Next** (CRM liens / emails) sans modules produit.
- [ ] **C** — D’abord **dashboard client** (style MEETING_n) ; CRM inchangé.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| BND-01 | A | Canon = doc/tech-stack/ réécrit |
| BND-02 | A | Data truth avant pages client |


