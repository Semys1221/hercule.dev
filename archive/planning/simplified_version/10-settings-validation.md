# 10 — Réglages ops

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../10-settings-validation.md](../10-settings-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **secrets** (clés API, mots de passe cron) restent dans les variables d’environnement.
- Certains **interrupteurs** (pause emails froids, agent IA) sont déjà en base, modifiés depuis l’ancien outil Streamlit.
- Les **délais par client** peuvent vivre dans un bloc JSON sur chaque fiche.

---

## Questions

#### [SET-01] Veux-tu un **bouton global** « file d’attente 15 jours » (qui change l’agenda client : 6 j vs 15 j grisés) ?

*Aujourd’hui : pas d’agenda dans l’app ; le délai 15 j existe déjà dans la config par fiche.*

- [x] **A (recommandé)** — **Oui, plus tard** avec l’agenda client ; un réglage global en base (comme les autres interrupteurs).
- [ ] **B** — **Non** : pas d’agenda / pas de bouton global ; 6 j vs 15 j par fiche ou pas au MVP.
- [ ] **C** — Bouton dans un **fichier** ou variable d’environnement, pas en base.

---



#### [SET-02] Les **interrupteurs ops** (pause webhook Instantly, agent IA) : on les garde dans l’ancien Streamlit ou on les met dans `/internal` ?

- [x] **A (recommandé)** — **Streamlit pour l’instant** ; éventuellement un écran Next plus tard, **mêmes tables**.
- [ ] **B** — **Migrer maintenant** dans `/internal`.
- [ ] **C** — **Tout** en variables d’environnement.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| SET-01 | A | Toggle file 15j plus tard |
| SET-02 | A | Toggles ops Streamlit pour l’instant |


